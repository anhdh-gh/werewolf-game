import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:werewolf_game_app/controllers/game/game_state.dart';
import 'package:werewolf_game_app/services/websocket/room_websocket_service.dart';
import 'dart:developer' as developer;

/// Provider cho GameController
final gameControllerProvider = 
    StateNotifierProvider<GameController, GameState>((ref) {
  return GameController();
});

/// Controller quản lý game flow logic
class GameController extends StateNotifier<GameState> {
  final FlutterTts _tts = FlutterTts();
  RoomWebSocketService? _wsService;
  String? _currentPlayerId;
  bool _ttsInitialized = false;

  GameController() : super(const GameState()) {
    _initializeTts();
  }

  /// Khởi tạo text-to-speech với tiếng Việt
  Future<void> _initializeTts() async {
    if (_ttsInitialized) return;
    
    try {
      await _tts.setLanguage("vi-VN"); // Tiếng Việt
      await _tts.setSpeechRate(0.5); // Tốc độ nói
      await _tts.setVolume(1.0); // Âm lượng
      await _tts.setPitch(1.0); // Cao độ
      _ttsInitialized = true;
      developer.log('🔊 [GameController] TTS initialized with Vietnamese');
    } catch (e) {
      developer.log('❌ [GameController] Error initializing TTS: $e');
    }
  }

  /// Set WebSocket service
  void setWebSocketService(RoomWebSocketService wsService) {
    _wsService = wsService;
  }

  /// Set current player ID
  void setCurrentPlayerId(String playerId) {
    _currentPlayerId = playerId;
  }

  /// Xử lý GAME_DATA_FLOW event
  void handleGameDataFlow(Map<String, dynamic> data) {
    try {
      final phase = data['phase'] as String?;
      final message = data['message'] as String?;
      final gameData = data['data'] as Map<String, dynamic>?;
      final players = gameData?['players'] as List?;
      
      // Parse event - có thể là String hoặc Map
      String? event;
      String? action;
      String? role;
      
      if (data.containsKey('event')) {
        final eventValue = data['event'];
        if (eventValue is String) {
          event = eventValue;
        } else if (eventValue is Map) {
          // Event là Map, lấy role và action từ đó
          final eventMap = eventValue as Map<String, dynamic>;
          role = eventMap['role']?.toString();
          action = eventMap['action']?.toString();
          // Tạo event string từ role và action
          if (role != null && action != null) {
            event = '$role:$action';
          } else if (role != null) {
            event = role;
          } else if (action != null) {
            event = action;
          }
        }
      }
      
      // Nếu action và role không có trong event, thử lấy từ root
      action = action ?? data['action']?.toString();
      role = role ?? data['role']?.toString();

      // Parse players với đầy đủ thông tin
      // Giữ players từ state trước đó nếu không có players mới trong gameData
      List<Map<String, dynamic>> parsedPlayers = state.players ?? [];
      
      if (players != null && players.isNotEmpty) {
        developer.log('🎮 [GameController] Parsing ${players.length} players from gameData');
        parsedPlayers = players.map((p) {
          if (p is Map) {
            return <String, dynamic>{
              'player_id': p['player_id'],
              'username': p['username'],
              'role': p['role']?.toString(), // Thêm role
              'initial_role': p['initial_role']?.toString(), // Thêm initial_role
              'is_alive': _parseBool(p['is_alive'], true),
              'is_muted': _parseBool(p['is_muted'], false),
              'is_protected': _parseBool(p['is_protected'], false),
              'is_connected': _parseBool(p['is_connected'], true),
              'witch_heal': p['witch_heal'],
              'witch_poison': p['witch_poison'],
            };
          }
          return <String, dynamic>{};
        }).toList();
        developer.log('🎮 [GameController] Parsed ${parsedPlayers.length} players');
      } else {
        developer.log('⚠️ [GameController] No players in gameData, keeping ${parsedPlayers.length} players from previous state');
      }

      // Tìm player hiện tại trong danh sách
      final currentPlayer = parsedPlayers.firstWhere(
        (p) => p['player_id'] == _currentPlayerId,
        orElse: () => <String, dynamic>{},
      );

      // Kiểm tra trạng thái đặc biệt
      final isAlive = _parseBool(currentPlayer['is_alive'], true);
      final isMuted = _parseBool(currentPlayer['is_muted'], false);

      // Xác định là đêm hay ngày
      final isNight = phase?.startsWith('NIGHT_') ?? false;
      final isDay = phase?.startsWith('DAY_') ?? false;

      // Kiểm tra player có thể act không
      final canAct = _canPlayerAct(phase, role, event, isAlive, isMuted);

      // Cập nhật state
      state = state.copyWith(
        currentPhase: phase,
        currentAction: action,
        currentRole: role,
        currentEvent: event,
        message: message,
        players: parsedPlayers,
        isNight: isNight,
        isDay: isDay,
        canAct: canAct,
        isDead: !isAlive,
        isMuted: isMuted,
        gameData: data, // Lưu raw data để có thể truy cập sau
      );

      // Phát âm thanh message nếu có và còn sống
      if (message != null && message.isNotEmpty && isAlive) {
        _speakMessage(message);
      }

      developer.log('🎮 [GameController] Phase: $phase, Action: $action, Role: $role, CanAct: $canAct');
    } catch (e) {
      developer.log('❌ [GameController] Error handling GAME_DATA_FLOW: $e');
    }
  }

  /// Parse boolean từ int (0/1) hoặc bool
  bool _parseBool(dynamic value, bool defaultValue) {
    if (value == null) return defaultValue;
    if (value is bool) return value;
    if (value is int) return value == 1;
    return defaultValue;
  }

  /// Kiểm tra player có thể thực hiện action không
  bool _canPlayerAct(String? phase, String? role, String? event, bool isAlive, bool isMuted) {
    // Nếu đã chết hoặc bị câm thì không thể act
    if (!isAlive || isMuted) return false;
    
    if (phase == null) return false;
    
    // Nếu event là null, không thể act
    if (event == null) return false;
    
    // Nếu event là "ALL" hoặc bắt đầu bằng "ALL:" thì tất cả đều có thể act
    if (event == 'ALL' || event.startsWith('ALL:')) return true;
    
    // Nếu event là role cụ thể, chỉ role đó mới có thể act
    // So sánh với role hiện tại của player
    if (role != null) {
      if (event == role || event.startsWith('$role:')) return true;
    }
    
    return false;
  }

  /// Phát âm thanh message bằng text-to-speech
  Future<void> _speakMessage(String message) async {
    try {
      if (!_ttsInitialized) {
        await _initializeTts();
      }
      await _tts.speak(message);
      developer.log('🔊 [GameController] Speaking: $message');
    } catch (e) {
      developer.log('❌ [GameController] Error speaking: $e');
    }
  }

  /// Dừng phát âm thanh
  Future<void> stopSpeaking() async {
    try {
      await _tts.stop();
    } catch (e) {
      developer.log('❌ [GameController] Error stopping speech: $e');
    }
  }

  /// Gửi PLAYER_INFO
  void sendPlayerInfo({String? targetId}) {
    if (_wsService == null) {
      developer.log('⚠️ [GameController] Cannot send PLAYER_INFO: WebSocket service not set');
      return;
    }
    
    _wsService!.emit('PLAYER_INFO', {
      if (targetId != null) 'target_id': targetId,
    });
    
    developer.log('📤 [GameController] Sent PLAYER_INFO - targetId: $targetId');
  }

  /// Gửi PLAYER_VOTE
  void sendPlayerVote(String targetPlayerId) {
    if (_wsService == null) {
      developer.log('⚠️ [GameController] Cannot send PLAYER_VOTE: WebSocket service not set');
      return;
    }
    
    // Kiểm tra điều kiện
    if (state.isDead) {
      developer.log('⚠️ [GameController] Cannot vote: Player is dead');
      return;
    }
    
    if (state.isMuted) {
      developer.log('⚠️ [GameController] Cannot vote: Player is muted');
      return;
    }
    
    if (!state.canAct) {
      developer.log('⚠️ [GameController] Cannot vote: Cannot act in current phase');
      return;
    }
    
    _wsService!.emit('PLAYER_VOTE', {
      'target_id': targetPlayerId,
    });
    
    state = state.copyWith(
      selectedPlayerId: targetPlayerId,
      hasVoted: true,
    );
    
    developer.log('📤 [GameController] Sent PLAYER_VOTE - targetId: $targetPlayerId');
  }

  /// Gửi PLAYER_DONE
  void sendPlayerDone() {
    if (_wsService == null) {
      developer.log('⚠️ [GameController] Cannot send PLAYER_DONE: WebSocket service not set');
      return;
    }
    
    _wsService!.emit('PLAYER_DONE', {});
    
    state = state.copyWith(
      hasDoneAction: true,
    );
    
    developer.log('📤 [GameController] Sent PLAYER_DONE');
  }

  /// Reset vote state (khi player chọn lại)
  void resetVote() {
    state = state.copyWith(
      selectedPlayerId: null,
      hasVoted: false,
    );
  }

  /// Set viewed role (khi Tiên tri xem role)
  void setViewedRole(String role) {
    state = state.copyWith(viewedRole: role);
  }
}

