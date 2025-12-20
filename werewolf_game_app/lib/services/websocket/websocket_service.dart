import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:werewolf_game_app/config/env.dart';
import 'package:werewolf_game_app/models/websocket/websocket_message.dart';
import 'package:werewolf_game_app/services/storage/token_storage.dart';

class WebSocketService {
  WebSocketChannel? _channel;
  String? _currentRoomCode;
  final _messageController = StreamController<WebSocketMessage>.broadcast();
  Timer? _reconnectTimer;
  bool _isConnecting = false;
  bool _shouldReconnect = true;

  Stream<WebSocketMessage> get messageStream => _messageController.stream;

  bool get isConnected => _channel != null;

  // Connect to WebSocket for a specific room
  Future<void> connect(String roomCode) async {
    if (_isConnecting || (_channel != null && _currentRoomCode == roomCode)) {
      return;
    }

    _isConnecting = true;
    _currentRoomCode = roomCode;
    _shouldReconnect = true;

    try {
      // Get access token for authentication
      final token = await TokenStorage.getAccessToken();
      
      // Build WebSocket URL - Socket.IO format
      final wsUrl = '${Env.wsBaseUrl}/socket.io/?EIO=4&transport=websocket';
      final uri = Uri.parse(wsUrl);
      
      // Connect WebSocket in a separate isolate/microtask to avoid blocking
      await Future.microtask(() {
        _channel = WebSocketChannel.connect(uri);
      });
      
      // Send CONNECT_ROOM event after connection (async, non-blocking)
      Future.delayed(const Duration(milliseconds: 300), () {
        if (_channel != null && _currentRoomCode == roomCode) {
          try {
            sendEvent('CONNECT_ROOM', {'roomCode': roomCode});
          } catch (e) {
            // Connection might not be ready yet, will retry
          }
        }
      });

      // Listen to incoming messages (non-blocking, async processing)
      _channel!.stream.listen(
        (data) {
          // Process message asynchronously to avoid blocking UI
          Future.microtask(() => _processMessage(data));
        },
        onError: (error) {
          Future.microtask(() {
            _messageController.add(
              WebSocketMessage(
                type: MessageType.error,
                message: 'WebSocket error: $error',
              ),
            );
            _scheduleReconnect(roomCode);
          });
        },
        onDone: () {
          Future.microtask(() {
            if (_shouldReconnect) {
              _scheduleReconnect(roomCode);
            }
          });
        },
        cancelOnError: false,
      );

      _isConnecting = false;
    } catch (e) {
      _isConnecting = false;
      _messageController.add(
        WebSocketMessage(
          type: MessageType.error,
          message: 'Connection error: $e',
        ),
      );
      _scheduleReconnect(roomCode);
    }
  }

  // Process incoming message (async to avoid blocking UI)
  void _processMessage(dynamic data) {
    // Use compute or isolate for heavy JSON parsing if needed
    // For now, wrap in try-catch to prevent blocking
    try {
      if (data is String) {
        // Handle Socket.IO protocol messages (might start with numbers)
        String cleanData = data;
        if (data.isNotEmpty && data[0].contains(RegExp(r'[0-9]'))) {
          // Socket.IO message format: "42["event",{data}]"
          // Extract JSON part after the protocol prefix
          final match = RegExp(r'\[.*\]').firstMatch(data);
          if (match != null) {
            cleanData = match.group(0) ?? data;
          }
        }
        
        try {
          // Parse JSON string (non-blocking)
          final jsonData = jsonDecode(cleanData);
          
          // Handle array response from Socket.IO
          if (jsonData is List && jsonData.length >= 2) {
            final eventName = jsonData[0] as String?;
            final eventData = jsonData[1] as Map<String, dynamic>?;
            
            final message = WebSocketMessage(
              type: _getMessageTypeFromEvent(eventName ?? ''),
              roomCode: eventData?['roomCode'] ?? _currentRoomCode,
              data: eventData,
              message: eventName,
            );
            _messageController.add(message);
          } else if (jsonData is Map<String, dynamic>) {
            final message = WebSocketMessage.fromJson(jsonData);
            _messageController.add(message);
          } else {
            // Fallback: create generic message
            final message = WebSocketMessage(
              type: MessageType.gameStateUpdate,
              roomCode: _currentRoomCode,
              message: cleanData,
              data: {'raw': cleanData},
            );
            _messageController.add(message);
          }
        } catch (e) {
          // If JSON parsing fails, create message from string
          final message = WebSocketMessage(
            type: MessageType.gameStateUpdate,
            roomCode: _currentRoomCode,
            message: data,
            data: {'raw': data},
          );
          _messageController.add(message);
        }
      } else {
        // Handle non-string data
        final message = WebSocketMessage(
          type: MessageType.gameStateUpdate,
          roomCode: _currentRoomCode,
          data: {'raw': data.toString()},
        );
        _messageController.add(message);
      }
    } catch (e) {
      // Prevent errors from blocking
      _messageController.add(
        WebSocketMessage(
          type: MessageType.error,
          message: 'Error parsing message: $e',
        ),
      );
    }
  }

  MessageType _getMessageTypeFromEvent(String eventName) {
    switch (eventName.toUpperCase()) {
      case 'NIGHT_START':
        return MessageType.nightStart;
      case 'ROLE_WAKE_UP':
        return MessageType.roleWakeUp;
      case 'ROLE_ACTION':
        return MessageType.roleAction;
      case 'DAY_START':
        return MessageType.dayStart;
      case 'VOTE':
        return MessageType.vote;
      case 'GAME_END':
        return MessageType.gameEnd;
      case 'PLAYER_JOINED':
        return MessageType.playerJoined;
      case 'PLAYER_LEFT':
        return MessageType.playerLeft;
      case 'GAME_STATE_UPDATE':
        return MessageType.gameStateUpdate;
      default:
        return MessageType.gameStateUpdate;
    }
  }

  // Send message to server
  void sendMessage(WebSocketMessage message) {
    if (_channel == null) {
      throw Exception('WebSocket not connected');
    }

    try {
      // Convert message to JSON string
      final jsonString = jsonEncode(message.toJson());
      _channel!.sink.add(jsonString);
    } catch (e) {
      _messageController.add(
        WebSocketMessage(
          type: MessageType.error,
          message: 'Error sending message: $e',
        ),
      );
    }
  }

  // Send JSON data directly
  void sendJson(Map<String, dynamic> data) {
    if (_channel == null) {
      throw Exception('WebSocket not connected');
    }

    try {
      // Convert map to JSON string
      final jsonString = jsonEncode(data);
      _channel!.sink.add(jsonString);
    } catch (e) {
      _messageController.add(
        WebSocketMessage(
          type: MessageType.error,
          message: 'Error sending JSON: $e',
        ),
      );
    }
  }

  // Send Socket.IO event (CONNECT_ROOM, LEAVE_ROOM, etc.)
  // Socket.IO format: "42["eventName",{data}]"
  void sendEvent(String event, Map<String, dynamic>? data) {
    if (_channel == null) {
      throw Exception('WebSocket not connected');
    }

    try {
      // Socket.IO message format: 42["eventName",{data}]
      // 4 = MESSAGE, 2 = EVENT
      final eventArray = [
        event,
        data ?? {},
      ];
      final jsonString = jsonEncode(eventArray);
      final socketIOMessage = '42$jsonString';
      _channel!.sink.add(socketIOMessage);
    } catch (e) {
      _messageController.add(
        WebSocketMessage(
          type: MessageType.error,
          message: 'Error sending event: $e',
        ),
      );
    }
  }

  // Schedule reconnection
  void _scheduleReconnect(String roomCode) {
    if (!_shouldReconnect) return;

    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(const Duration(seconds: 5), () {
      if (_shouldReconnect && _currentRoomCode == roomCode) {
        connect(roomCode);
      }
    });
  }

  // Disconnect from WebSocket
  Future<void> disconnect() async {
    _shouldReconnect = false;
    _reconnectTimer?.cancel();
    
    // Send LEAVE_ROOM event before disconnecting
    if (_channel != null && _currentRoomCode != null) {
      try {
        sendEvent('LEAVE_ROOM', {'roomCode': _currentRoomCode});
        await Future.delayed(const Duration(milliseconds: 100));
      } catch (e) {
        // Ignore errors when leaving
      }
    }
    
    await _channel?.sink.close();
    _channel = null;
    _currentRoomCode = null;
    _isConnecting = false;
  }

  // Dispose resources
  void dispose() {
    disconnect();
    _messageController.close();
  }
}

