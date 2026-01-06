import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:werewolf_game_app/services/api/room_api_service.dart';
import 'package:werewolf_game_app/services/websocket/room_websocket_service.dart';
import 'package:werewolf_game_app/controllers/room/room_state.dart';
import 'package:werewolf_game_app/services/storage/token_storage.dart';
import 'dart:developer' as developer;

/// Provider cho RoomController
final roomControllerProvider = 
    StateNotifierProvider<RoomController, RoomState>((ref) {
  return RoomController();
});

/// Controller quản lý business logic cho Room
/// Tách biệt hoàn toàn khỏi UI
class RoomController extends StateNotifier<RoomState> {
  final RoomApiService _roomApiService = RoomApiService();
  RoomWebSocketService? _wsService;

  RoomController() : super(const RoomState());

  /// Get WebSocket service (để GameController có thể dùng)
  RoomWebSocketService? get wsService => _wsService;

  /// Tạo phòng mới với max_players
  Future<void> createRoom({int maxPlayers = 4}) async {
    state = state.copyWith(
      isLoading: true,
      errorMessage: null,
      maxPlayers: maxPlayers,
    );

    try {
      // Kiểm tra token trước khi tạo room
      final token = await TokenStorage.getAccessToken();
      if (token == null || token.isEmpty) {
        throw Exception('Access token not found. Please login again.');
      }
      
      final response = await _roomApiService.createRoom(maxPlayers: maxPlayers);
      
      final roomCode = response.data.room.code;
      final websocketUrl = response.data.nextStep.websocket;
      
      // Kiểm tra websocketUrl
      if (websocketUrl.isEmpty) {
        throw Exception('WebSocket URL is empty from server response');
      }

      state = state.copyWith(
        roomCode: roomCode,
        isLoading: false,
      );

      await _connectWebSocket(websocketUrl, roomCode);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      );
      rethrow;
    }
  }

  /// Join vào phòng (cho người chơi)
  Future<void> joinRoom(String roomCode) async {
    state = state.copyWith(
      isLoading: true,
      errorMessage: null,
    );

    try {
      // Kiểm tra token trước khi join
      final token = await TokenStorage.getAccessToken();
      if (token == null || token.isEmpty) {
        throw Exception('Access token not found. Please login again.');
      }
      
      final response = await _roomApiService.joinRoom(roomCode);
      
      final joinedRoomCode = response.data.room.code;
      final websocketUrl = response.data.nextStep.websocket;
      
      // Kiểm tra websocketUrl
      if (websocketUrl.isEmpty) {
        throw Exception('WebSocket URL is empty from server response');
      }

      state = state.copyWith(
        roomCode: joinedRoomCode,
        isLoading: false,
      );

      await _connectWebSocket(websocketUrl, joinedRoomCode);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      );
      rethrow;
    }
  }

  /// Join room với room code và websocket URL có sẵn
  /// Dùng khi đã có thông tin từ màn hình join
  Future<void> joinRoomWithParams({
    required String roomCode,
    required String websocketUrl,
  }) async {
    state = state.copyWith(
      roomCode: roomCode,
      isLoading: false,
      errorMessage: null,
    );

    await _connectWebSocket(websocketUrl, roomCode);
  }

  /// Kết nối WebSocket và listen events
  Future<void> _connectWebSocket(String websocketUrl, String roomCode) async {
    try {
      _wsService = RoomWebSocketService();
      
      await _wsService!.connect(websocketUrl, roomCode);

      // Listen cho connection status
      _wsService!.statusStream.listen((status) {
        state = state.copyWith(
          isConnected: status == WebSocketStatus.connected,
        );
      });

      // Listen cho ROOM_PLAYERS event
      _wsService!.roomPlayersStream.listen((data) {
        _handleRoomPlayersEvent(data);
      });

      // Listen cho JOIN_ROOM event
      _wsService!.joinRoomStream.listen((data) {
        _handleJoinRoomEvent(data);
      });

      // Listen cho PLAYER_READY event
      _wsService!.playerReadyStream.listen((data) {
        _handlePlayerReadyEvent(data);
      });

      // Listen cho GAME_START event
      _wsService!.gameStartStream.listen((data) {
        _handleGameStartEvent(data);
      });

      // Listen cho GAME_DATA_FLOW event
      _wsService!.gameDataFlowStream.listen((data) {
        _handleGameDataFlowEvent(data);
      });

      // Listen cho SOCKET_ERROR event
      _wsService!.socketErrorStream.listen((data) {
        _handleSocketErrorEvent(data);
      });
    } catch (e) {
      state = state.copyWith(
        errorMessage: 'Failed to connect to game server',
        isConnected: false,
      );
      rethrow;
    }
  }

  /// Xử lý ROOM_PLAYERS event - Cập nhật danh sách người chơi
  void _handleRoomPlayersEvent(Map<String, dynamic> data) {
    try {
      List<Map<String, dynamic>> players = [];
      int playerCount = 0;
      int joinedCount = 0;
      int readyCount = 0;

      // ✅ SỬA: Hỗ trợ format mới {"data":{"players":[...]}}
      Map<String, dynamic> actualData = data;
      if (data.containsKey('data') && data['data'] is Map) {
        actualData = data['data'] as Map<String, dynamic>;
      }

      // Parse data từ backend - thử nhiều format
      if (actualData.containsKey('players') && actualData['players'] is List) {
        final playersList = actualData['players'] as List;
        
        players = List<Map<String, dynamic>>.from(
          playersList.map((p) {
            if (p is Map) {
              return Map<String, dynamic>.from(p);
            } else if (p is String) {
              return {'name': p, 'username': p};
            } else {
              return {'name': p.toString(), 'username': p.toString()};
            }
          })
        );
        playerCount = players.length;
        joinedCount = players.length;
        
        // Đếm số người đã ready từ players list
        readyCount = players.where((p) {
          final isReady = p['is_ready'] == true || 
                         p['isReady'] == true || 
                         p['ready'] == true;
          return isReady;
        }).length;
      } 
      
      // Thử parse từ data trực tiếp nếu là List
      else if (actualData is List) {
        players = List<Map<String, dynamic>>.from(
          (actualData as List).map((p) => 
            p is Map ? Map<String, dynamic>.from(p) : {'name': p.toString()}
          )
        );
        playerCount = players.length;
        joinedCount = players.length;
        
        // Đếm số người đã ready
        readyCount = players.where((p) {
          final isReady = p['is_ready'] == true || 
                         p['isReady'] == true || 
                         p['ready'] == true;
          return isReady;
        }).length;
      }
      
      // Parse từ các field khác
      else {
        // Parse số lượng players
        if (actualData.containsKey('count')) {
          playerCount = actualData['count'] as int? ?? 0;
          joinedCount = playerCount;
        } else if (actualData.containsKey('player_count')) {
          playerCount = actualData['player_count'] as int? ?? 0;
          joinedCount = playerCount;
        } else if (actualData.containsKey('total_players')) {
          playerCount = actualData['total_players'] as int? ?? 0;
          joinedCount = playerCount;
        } else if (actualData.containsKey('joined_players')) {
          playerCount = actualData['joined_players'] as int? ?? 0;
          joinedCount = playerCount;
        }
        
        // Parse số lượng ready players
        if (actualData.containsKey('ready_players')) {
          readyCount = actualData['ready_players'] as int? ?? 0;
        } else if (actualData.containsKey('ready_count')) {
          readyCount = actualData['ready_count'] as int? ?? 0;
        }
        
        // Thử parse players từ các field khác
        if (actualData.containsKey('player_list') && actualData['player_list'] is List) {
          final playerList = actualData['player_list'] as List;
          players = List<Map<String, dynamic>>.from(
            playerList.map((p) => 
              p is Map ? Map<String, dynamic>.from(p) : {'name': p.toString()}
            )
          );
          playerCount = players.length;
          joinedCount = players.length;
          
          // Đếm số người đã ready
          readyCount = players.where((p) {
            final isReady = p['is_ready'] == true || 
                           p['isReady'] == true || 
                           p['ready'] == true;
            return isReady;
          }).length;
        }
      }

      // Cập nhật state - đảm bảo cập nhật đầy đủ thông tin
      final finalCount = playerCount > 0 ? playerCount : players.length;
      final finalJoined = joinedCount > 0 ? joinedCount : finalCount;
      
      developer.log('👥 [RoomController] ROOM_PLAYERS - players: ${players.length}, joined: $finalJoined, ready: $readyCount, maxPlayers: ${state.maxPlayers}');
      
      state = state.copyWith(
        players: players,
        playerCount: finalCount,
        joinedPlayers: finalJoined > 0 ? finalJoined : state.joinedPlayers,
        readyPlayers: readyCount > 0 ? readyCount : state.readyPlayers,
      );

      // Log để debug - kiểm tra điều kiện start game
      final currentReady = readyCount > 0 ? readyCount : state.readyPlayers;
      if (currentReady >= state.maxPlayers) {
        developer.log('🎮 [RoomController] All players ready from ROOM_PLAYERS! Ready: $currentReady/${state.maxPlayers}');
      }
    } catch (e) {
      // Silent error handling
    }
  }

  /// Xử lý JOIN_ROOM event - Cập nhật số người đã join và danh sách players
  void _handleJoinRoomEvent(Map<String, dynamic> data) {
    try {
      int joinedCount = state.joinedPlayers;
      List<Map<String, dynamic>> players = state.players;
      
      // Ưu tiên dùng số lượng từ backend (chính xác hơn)
      if (data.containsKey('count')) {
        joinedCount = data['count'] as int? ?? joinedCount;
      } else if (data.containsKey('joined_players')) {
        joinedCount = data['joined_players'] as int? ?? joinedCount;
      } else if (data.containsKey('player_count')) {
        joinedCount = data['player_count'] as int? ?? joinedCount;
      } else {
        // Nếu backend không gửi số lượng, tự tăng (fallback)
        joinedCount = state.joinedPlayers + 1;
      }

      // Nếu JOIN_ROOM event có kèm danh sách players, cập nhật luôn
      if (data.containsKey('players') && data['players'] is List) {
        final playersList = data['players'] as List;
        
        players = List<Map<String, dynamic>>.from(
          playersList.map((p) {
            if (p is Map) {
              return Map<String, dynamic>.from(p);
            } else if (p is String) {
              return {'name': p, 'username': p};
            } else {
              return {'name': p.toString(), 'username': p.toString()};
            }
          })
        );
      }
      // Thử các field khác có thể chứa players
      else if (data.containsKey('player_list') && data['player_list'] is List) {
        final playerList = data['player_list'] as List;
        players = List<Map<String, dynamic>>.from(
          playerList.map((p) => 
            p is Map ? Map<String, dynamic>.from(p) : {'name': p.toString()}
          )
        );
      }

      // Cập nhật state với cả joinedCount và players
      state = state.copyWith(
        joinedPlayers: joinedCount,
        players: players,
        playerCount: players.isNotEmpty ? players.length : (joinedCount > 0 ? joinedCount : state.playerCount),
      );
    } catch (e) {
      // Silent error handling
    }
  }

  /// Xử lý PLAYER_READY event - Cập nhật số người đã ready
  void _handlePlayerReadyEvent(Map<String, dynamic> data) {
    try {
      int readyCount = state.readyPlayers;
      
      // Ưu tiên dùng số lượng từ backend (chính xác hơn)
      if (data.containsKey('count')) {
        readyCount = data['count'] as int? ?? readyCount;
      } else if (data.containsKey('ready_players')) {
        readyCount = data['ready_players'] as int? ?? readyCount;
      } else {
        // Nếu backend không gửi số lượng, tự tăng (fallback)
        readyCount = state.readyPlayers + 1;
      }

      developer.log('✅ [RoomController] PLAYER_READY - readyCount: $readyCount, maxPlayers: ${state.maxPlayers}, joinedPlayers: ${state.joinedPlayers}');

      state = state.copyWith(
        readyPlayers: readyCount,
      );

      // Log để debug - kiểm tra điều kiện start game
      if (readyCount >= state.maxPlayers) {
        developer.log('🎮 [RoomController] All players ready! Ready: $readyCount/${state.maxPlayers} - Waiting for backend to send GAME_DATA_FLOW');
      } else {
        developer.log('⏳ [RoomController] Waiting for more players. Ready: $readyCount/${state.maxPlayers}');
      }
    } catch (e) {
      developer.log('❌ [RoomController] Error handling PLAYER_READY: $e');
    }
  }

  /// Xử lý GAME_START event - Bắt đầu game
  void _handleGameStartEvent(Map<String, dynamic> data) {
    try {
      // Navigate to game screen hoặc xử lý logic bắt đầu game
      // Có thể emit event hoặc update state để UI navigate
    } catch (e) {
      // Silent error handling
    }
  }

  /// Xử lý GAME_DATA_FLOW event - Nhận data game (role, etc.)
  void _handleGameDataFlowEvent(Map<String, dynamic> data) {
    try {
      // Log phase để debug
      if (data.containsKey('phase')) {
        developer.log('📊 [RoomController] GAME_DATA_FLOW phase: ${data['phase']}');
      }
      
      // Lưu game data vào state
      state = state.copyWith(
        gameData: data,
      );
    } catch (e) {
      developer.log('❌ [RoomController] Error handling GAME_DATA_FLOW: $e');
    }
  }

  /// Gửi PLAYER_READY
  void sendPlayerReady() {
    if (_wsService == null || state.roomCode == null) {
      return;
    }

    if (state.isReady) {
      return;
    }

    _wsService!.sendPlayerReady();
    state = state.copyWith(isReady: true);
  }

  /// Gửi PLAYER_INFO
  void sendPlayerInfo({String? targetId}) {
    if (_wsService == null) return;
    _wsService!.emit('PLAYER_INFO', {
      if (targetId != null) 'target_id': targetId,
    });
  }

  /// Gửi PLAYER_VOTE
  void sendPlayerVote(String targetPlayerId) {
    if (_wsService == null) return;
    _wsService!.emit('PLAYER_VOTE', {
      'target_id': targetPlayerId,
    });
  }

  /// Gửi PLAYER_DONE
  void sendPlayerDone() {
    if (_wsService == null) return;
    _wsService!.emit('PLAYER_DONE', {});
  }

  /// Xử lý SOCKET_ERROR event
  void _handleSocketErrorEvent(Map<String, dynamic> data) {
    try {
      String errorMessage = 'An error occurred';
      if (data.containsKey('message')) {
        errorMessage = data['message'] as String;
      } else if (data.containsKey('error')) {
        errorMessage = data['error'].toString();
      } else if (data.containsKey('reason')) {
        errorMessage = data['reason'] as String;
      }

      state = state.copyWith(
        errorMessage: errorMessage,
        isConnected: false,
      );
    } catch (e) {
      // Silent error handling
    }
  }

  /// Rời phòng
  Future<void> leaveRoom() async {
    if (_wsService != null && state.roomCode != null) {
      _wsService!.leaveRoom();
      await _wsService!.disconnect();
      _wsService = null;
    }
    
    // Reset state về trạng thái ban đầu
    state = state.reset();
  }

  /// Clear error message
  void clearError() {
    state = state.copyWith(errorMessage: null);
  }

  @override
  void dispose() {
    _wsService?.disconnect();
    _wsService?.dispose();
    super.dispose();
  }
}
