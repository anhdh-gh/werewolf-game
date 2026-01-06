// werewolf_game_app/lib/services/websocket/room_websocket_service.dart
import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'dart:developer' as developer;

import 'package:werewolf_game_app/services/storage/token_storage.dart';

enum WebSocketStatus {
  disconnected,
  connecting,
  connected,
  error,
}

class RoomWebSocketService {
  IO.Socket? _socket;
  WebSocketStatus _status = WebSocketStatus.disconnected;
  final _statusController = StreamController<WebSocketStatus>.broadcast();
  
  // Streams cho từng event cụ thể
  final _roomPlayersController = StreamController<Map<String, dynamic>>.broadcast();
  final _socketErrorController = StreamController<Map<String, dynamic>>.broadcast();
  final _joinRoomController = StreamController<Map<String, dynamic>>.broadcast();
  final _playerReadyController = StreamController<Map<String, dynamic>>.broadcast();
  final _gameStartController = StreamController<Map<String, dynamic>>.broadcast();
  final _gameDataFlowController = StreamController<Map<String, dynamic>>.broadcast();
  
  String? _roomCode;
  // ignore: unused_field
  String? _websocketUrl; // Stored for potential future use

  Stream<WebSocketStatus> get statusStream => _statusController.stream;
  WebSocketStatus get status => _status;

  Stream<Map<String, dynamic>> get roomPlayersStream => _roomPlayersController.stream;
  Stream<Map<String, dynamic>> get socketErrorStream => _socketErrorController.stream;
  Stream<Map<String, dynamic>> get joinRoomStream => _joinRoomController.stream;
  Stream<Map<String, dynamic>> get playerReadyStream => _playerReadyController.stream;
  Stream<Map<String, dynamic>> get gameStartStream => _gameStartController.stream;
  Stream<Map<String, dynamic>> get gameDataFlowStream => _gameDataFlowController.stream;

  /// Kết nối tới Socket.IO server
  Future<void> connect(String websocketUrl, String roomCode) async {
    developer.log('🔌 [WS] connect called - url: $websocketUrl, code: $roomCode');
    
    if (_status == WebSocketStatus.connected) {
      developer.log('⚠️ [WS] Already connected');
      return;
    }

    _websocketUrl = websocketUrl;
    _roomCode = roomCode;

    try {
      _updateStatus(WebSocketStatus.connecting);
      developer.log('🔄 [WS] Connecting to: $websocketUrl');
      
      final accessToken = await TokenStorage.getAccessToken();
      
      // Kiểm tra token chi tiết
      if (accessToken == null) {
        developer.log('❌ [WS] Access token is NULL!');
        throw Exception('Access token not found. Please login again.');
      } else if (accessToken.isEmpty) {
        developer.log('❌ [WS] Access token is EMPTY!');
        throw Exception('Access token is empty. Please login again.');
      } else {
        developer.log('🔑 [WS] Access token retrieved: ${accessToken.substring(0, accessToken.length > 20 ? 20 : accessToken.length)}... (length: ${accessToken.length})');
      }
      
      // Normalize WebSocket URL (ws -> wss nếu cần)
      String normalizedUrl = websocketUrl;
      if (websocketUrl.startsWith('ws://')) {
        developer.log('⚠️ [WS] WebSocket URL uses ws://, consider using wss:// for secure connection');
      }
      developer.log('🔌 [WS] Using WebSocket URL: $normalizedUrl');
      
      developer.log('🔌 [WS] Creating Socket.IO instance...');
      
      try {
        // Thử format auth với nhiều option
        _socket = IO.io(
          normalizedUrl,
          IO.OptionBuilder()
              .setTransports(['websocket'])
              .setAuth({
                'access_token': accessToken,  // Format 1
                'token': accessToken,         // Format 2 (backup)
              })
              .setExtraHeaders({
                'Authorization': 'Bearer $accessToken',  // Format 3 (backup)
              })
              .enableAutoConnect()
              .build(),
        );
        developer.log('🔌 [WS] Socket.IO instance created with auth and headers');
        
        // Log socket state ngay sau khi tạo
        developer.log('🔌 [WS] Socket state after creation - connected: ${_socket!.connected}, disconnected: ${_socket!.disconnected}');
        
        // ✅ QUAN TRỌNG: Đăng ký TẤT CẢ listeners TRƯỚC khi connect
        // Listen cho các event connection
        _socket!.onConnect((_) {
          developer.log('✅ [WS] Connected successfully to: $normalizedUrl');
          developer.log('✅ [WS] Socket ID: ${_socket!.id}');
          _updateStatus(WebSocketStatus.connected);
          
          // ✅ QUAN TRỌNG: Emit CONNECT_ROOM NGAY LẬP TỨC khi connect
          // Server có thể disconnect nếu không nhận được CONNECT_ROOM trong thời gian ngắn
          final connectRoomData = {
            'room': {
              'code': roomCode
            }
          };
          developer.log('📤 [WS] Emitting CONNECT_ROOM immediately in onConnect with data: $connectRoomData');
          try {
            _socket!.emit('CONNECT_ROOM', connectRoomData);
            developer.log('📤 [WS] Emitted CONNECT_ROOM successfully with code: $roomCode');
          } catch (e) {
            developer.log('❌ [WS] Error emitting CONNECT_ROOM: $e');
          }
        });
        
        // Listen cho event 'connecting' (khi đang trong quá trình connect)
        _socket!.on('connecting', (data) {
          developer.log('🔄 [WS] Connecting event fired: $data');
          _updateStatus(WebSocketStatus.connecting);
        });
        
        // Listen cho event 'connect' (tương tự onConnect nhưng là event name)
        _socket!.on('connect', (data) {
          developer.log('✅ [WS] Connect event fired: $data');
          developer.log('✅ [WS] Socket ID from event: ${_socket!.id}');
          
          // ✅ QUAN TRỌNG: Emit CONNECT_ROOM ngay trong event 'connect' để đảm bảo kịp thời
          final connectRoomData = {
            'room': {
              'code': roomCode
            }
          };
          developer.log('📤 [WS] Emitting CONNECT_ROOM in connect event with data: $connectRoomData');
          _socket!.emit('CONNECT_ROOM', connectRoomData);
        });

        _socket!.onDisconnect((reason) {
          developer.log('🔌 [WS] Disconnected - reason: $reason');
          developer.log('🔌 [WS] Disconnect reason type: ${reason.runtimeType}');
          if (reason is String) {
            developer.log('🔌 [WS] Disconnect reason string: $reason');
          }
          _updateStatus(WebSocketStatus.disconnected);
        });

        _socket!.onConnectError((error) {
          developer.log('❌ [WS] Connection error: $error');
          developer.log('❌ [WS] Error type: ${error.runtimeType}');
          developer.log('❌ [WS] Error details: ${error.toString()}');
          
          // Kiểm tra nếu là lỗi Unauthorized
          final errorStr = error.toString().toLowerCase();
          if (errorStr.contains('unauthorized') || 
              errorStr.contains('401') ||
              errorStr.contains('authentication')) {
            developer.log('❌ [WS] Unauthorized error detected!');
            developer.log('❌ [WS] Token may be invalid, expired, or format is incorrect');
            developer.log('❌ [WS] Current token: ${accessToken.substring(0, accessToken.length > 30 ? 30 : accessToken.length)}...');
            developer.log('❌ [WS] Token length: ${accessToken.length}');
          }
          
          _updateStatus(WebSocketStatus.error);
        });

        // ✅ Thêm listener cho connect_error event (khác với onConnectError)
        _socket!.on('connect_error', (error) {
          developer.log('❌ [WS] connect_error event fired: $error');
          developer.log('❌ [WS] Error type: ${error.runtimeType}');
          if (error is Map) {
            developer.log('❌ [WS] Error map: $error');
          } else if (error is String) {
            developer.log('❌ [WS] Error string: $error');
          }
        });

        // Listen cho ROOM_PLAYERS event
        _socket!.on('ROOM_PLAYERS', (data) {
          developer.log('👥 [WS] ROOM_PLAYERS event received: $data');
          
          try {
            Map<String, dynamic> eventData;
            if (data is Map) {
              eventData = Map<String, dynamic>.from(data);
            } else if (data is List && data.isNotEmpty) {
              eventData = {'players': data};
            } else {
              eventData = {'data': data};
            }
            
            _roomPlayersController.add(eventData);
          } catch (e) {
            developer.log('❌ [WS] Error parsing ROOM_PLAYERS: $e');
          }
        });

        // Listen cho JOIN_ROOM event
        _socket!.on('JOIN_ROOM', (data) {
          developer.log('👤 [WS] JOIN_ROOM event received: $data');
          try {
            Map<String, dynamic> eventData;
            if (data is Map) {
              eventData = Map<String, dynamic>.from(data);
            } else {
              eventData = {'data': data};
            }
            _joinRoomController.add(eventData);
          } catch (e) {
            developer.log('❌ [WS] Error parsing JOIN_ROOM: $e');
          }
        });

        // Listen cho PLAYER_READY event
        _socket!.on('PLAYER_READY', (data) {
          developer.log('✅ [WS] PLAYER_READY event received: $data');
          try {
            Map<String, dynamic> eventData;
            if (data is Map) {
              eventData = Map<String, dynamic>.from(data);
            } else {
              eventData = {'data': data};
            }
            _playerReadyController.add(eventData);
          } catch (e) {
            developer.log('❌ [WS] Error parsing PLAYER_READY: $e');
          }
        });

        // Listen cho GAME_START event
        _socket!.on('GAME_START', (data) {
          developer.log('🎮 [WS] GAME_START event received: $data');
          try {
            Map<String, dynamic> eventData;
            if (data is Map) {
              eventData = Map<String, dynamic>.from(data);
            } else {
              eventData = {'data': data};
            }
            _gameStartController.add(eventData);
          } catch (e) {
            developer.log('❌ [WS] Error parsing GAME_START: $e');
          }
        });

        // Listen cho GAME_DATA_FLOW event
        _socket!.on('GAME_DATA_FLOW', (data) {
          developer.log('📊 [WS] GAME_DATA_FLOW event received: $data');
          try {
            Map<String, dynamic> eventData;
            if (data is Map) {
              eventData = Map<String, dynamic>.from(data);
            } else {
              eventData = {'data': data};
            }
            _gameDataFlowController.add(eventData);
          } catch (e) {
            developer.log('❌ [WS] Error parsing GAME_DATA_FLOW: $e');
          }
        });

        // Listen cho SOCKET_ERROR event
        _socket!.on('SOCKET_ERROR', (data) {
          developer.log('❌ [WS] SOCKET_ERROR event received: $data');
          
          try {
            Map<String, dynamic> errorData;
            if (data is Map) {
              errorData = Map<String, dynamic>.from(data);
            } else if (data is String) {
              errorData = {'message': data};
            } else {
              errorData = {'error': data};
            }
            
            _socketErrorController.add(errorData);
            _updateStatus(WebSocketStatus.error);
          } catch (e) {
            developer.log('❌ [WS] Error parsing SOCKET_ERROR: $e');
          }
        });

        // Listen cho 'error' event (khác với onConnectError)
        _socket!.on('error', (data) {
          developer.log('❌ [WS] Socket error event: $data');
          developer.log('❌ [WS] Error data type: ${data.runtimeType}');
          _updateStatus(WebSocketStatus.error);
        });

        // Listen cho 'connect_timeout'
        _socket!.on('connect_timeout', (data) {
          developer.log('⏱️ [WS] Connection timeout: $data');
          _updateStatus(WebSocketStatus.error);
        });

        // Listen cho 'reconnect' events
        _socket!.on('reconnect', (data) {
          developer.log('🔄 [WS] Reconnected: $data');
          _updateStatus(WebSocketStatus.connected);
        });

        _socket!.on('reconnect_attempt', (data) {
          developer.log('🔄 [WS] Reconnect attempt: $data');
          _updateStatus(WebSocketStatus.connecting);
        });

        _socket!.on('reconnect_error', (error) {
          developer.log('❌ [WS] Reconnect error: $error');
          _updateStatus(WebSocketStatus.error);
        });

        _socket!.on('reconnect_failed', (data) {
          developer.log('❌ [WS] Reconnect failed: $data');
          _updateStatus(WebSocketStatus.error);
        });

        developer.log('🔌 [WS] All event listeners registered');
        
        // ✅ Sau khi đăng ký listeners, kiểm tra và connect nếu cần
        if (!_socket!.connected) {
          developer.log('🔌 [WS] Socket not connected yet, waiting for autoConnect...');
          // Có thể cần đợi một chút để autoConnect hoạt động
          await Future.delayed(const Duration(milliseconds: 500));
          developer.log('🔌 [WS] After delay - connected: ${_socket!.connected}, disconnected: ${_socket!.disconnected}');
          
          // Nếu vẫn chưa connect, thử connect thủ công
          if (!_socket!.connected && _socket!.disconnected) {
            developer.log('🔌 [WS] Attempting manual connect...');
            try {
              _socket!.connect();
              developer.log('🔌 [WS] Manual connect() called successfully');
              // Đợi một chút để connect hoàn tất
              await Future.delayed(const Duration(milliseconds: 500));
              
              // ✅ QUAN TRỌNG: Nếu đã connect, emit CONNECT_ROOM ngay lập tức
              if (_socket!.connected) {
                final connectRoomData = {
                  'room': {
                    'code': roomCode
                  }
                };
                developer.log('📤 [WS] Emitting CONNECT_ROOM immediately after manual connect: $connectRoomData');
                try {
                  _socket!.emit('CONNECT_ROOM', connectRoomData);
                  developer.log('📤 [WS] Emitted CONNECT_ROOM successfully after manual connect');
                } catch (e) {
                  developer.log('❌ [WS] Error emitting CONNECT_ROOM after manual connect: $e');
                }
              }
              
              // Đợi thêm một chút để xem kết quả
              await Future.delayed(const Duration(milliseconds: 500));
              developer.log('🔌 [WS] After manual connect - connected: ${_socket!.connected}, disconnected: ${_socket!.disconnected}');
            } catch (e) {
              developer.log('❌ [WS] Error calling manual connect(): $e');
              developer.log('❌ [WS] Error type: ${e.runtimeType}');
            }
          }
        } else {
          developer.log('✅ [WS] Socket already connected!');
          // ✅ Nếu đã connected, emit CONNECT_ROOM ngay
          final connectRoomData = {
            'room': {
              'code': roomCode
            }
          };
          developer.log('📤 [WS] Emitting CONNECT_ROOM immediately (already connected): $connectRoomData');
          try {
            _socket!.emit('CONNECT_ROOM', connectRoomData);
            developer.log('📤 [WS] Emitted CONNECT_ROOM successfully (already connected)');
          } catch (e) {
            developer.log('❌ [WS] Error emitting CONNECT_ROOM (already connected): $e');
          }
        }

        // Thêm timeout check sau 5 giây
        Future.delayed(const Duration(seconds: 5), () {
          if (_status != WebSocketStatus.connected && _socket != null) {
            developer.log('⏱️ [WS] Connection timeout - still not connected after 5 seconds');
            developer.log('⏱️ [WS] Current status: $_status');
            developer.log('⏱️ [WS] Socket connected: ${_socket!.connected}');
            developer.log('⏱️ [WS] Socket disconnected: ${_socket!.disconnected}');
            developer.log('⏱️ [WS] Socket ID: ${_socket!.id}');
          } else if (_status == WebSocketStatus.connected) {
            developer.log('✅ [WS] Connection successful within timeout period');
          }
        });
      } catch (e) {
        developer.log('❌ [WS] Error creating Socket.IO instance: $e');
        developer.log('❌ [WS] Error type: ${e.runtimeType}');
        developer.log('❌ [WS] Error stack trace: ${StackTrace.current}');
        _updateStatus(WebSocketStatus.error);
        rethrow;
      }
    } catch (e) {
      developer.log('❌ [WS] Connection failed: $e');
      developer.log('❌ [WS] Error stack trace: ${StackTrace.current}');
      _updateStatus(WebSocketStatus.error);
      rethrow;
    }
  }

  /// ✅ THÊM: Rời phòng - Emit LEAVE_ROOM event
  void leaveRoom() {
    if (_status != WebSocketStatus.connected || _socket == null || _roomCode == null) {
      developer.log('⚠️ [WS] Cannot leave room: not connected or no room code');
      return;
    }

    try {
      // Emit LEAVE_ROOM với format {room: {code: "..."}}
      _socket!.emit('LEAVE_ROOM', {
        'room': {
          'code': _roomCode
        }
      });
      developer.log('📤 [WS] Emitted LEAVE_ROOM with code: $_roomCode');
    } catch (e) {
      developer.log('❌ [WS] Leave room error: $e');
    }
  }

  /// Gửi PLAYER_READY event
  void sendPlayerReady() {
    if (_status != WebSocketStatus.connected || _socket == null || _roomCode == null) {
      developer.log('⚠️ [WS] Cannot send ready: not connected or no room code');
      return;
    }

    try {
      _socket!.emit('PLAYER_READY', {
        'room': {
          'code': _roomCode
        }
      });
      developer.log('📤 [WS] Emitted PLAYER_READY with code: $_roomCode');
    } catch (e) {
      developer.log('❌ [WS] Send ready error: $e');
    }
  }

  /// Gửi message/event tới server
  void emit(String event, dynamic data) {
    if (_status != WebSocketStatus.connected || _socket == null) {
      developer.log('⚠️ [WS] Cannot emit: not connected');
      return;
    }

    try {
      _socket!.emit(event, data);
      developer.log('📤 [WS] Emitted $event: $data');
    } catch (e) {
      developer.log('❌ [WS] Emit error: $e');
    }
  }

  Future<void> disconnect() async {
    if (_socket != null) {
      _socket!.disconnect();
      _socket!.dispose();
      _socket = null;
      _updateStatus(WebSocketStatus.disconnected);
      developer.log('🔌 [WS] Disconnected');
    }
  }

  void _updateStatus(WebSocketStatus newStatus) {
    developer.log('🔄 [WS] Status changed: $_status -> $newStatus');
    _status = newStatus;
    _statusController.add(newStatus);
  }

  void dispose() {
    disconnect();
    _statusController.close();
    _roomPlayersController.close();
    _socketErrorController.close();
    _joinRoomController.close();
    _playerReadyController.close();
    _gameStartController.close();
    _gameDataFlowController.close();
  }
}