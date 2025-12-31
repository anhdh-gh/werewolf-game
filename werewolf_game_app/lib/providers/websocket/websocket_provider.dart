import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:werewolf_game_app/models/websocket/websocket_message.dart';
import 'package:werewolf_game_app/services/websocket/websocket_service.dart';

// WebSocket Service Provider
final websocketServiceProvider = Provider<WebSocketService>((ref) {
  final service = WebSocketService();
  ref.onDispose(() {
    service.dispose();
  });
  return service;
});

// WebSocket Connection State Provider
final websocketConnectionProvider =
    StateNotifierProvider<WebSocketConnectionNotifier, bool>((ref) {
  return WebSocketConnectionNotifier(ref);
});

class WebSocketConnectionNotifier extends StateNotifier<bool> {
  final Ref ref;

  WebSocketConnectionNotifier(this.ref) : super(false) {
    _init();
  }

  void _init() {
    final service = ref.read(websocketServiceProvider);
    state = service.isConnected;
  }

  Future<void> connect(String roomCode) async {
    final service = ref.read(websocketServiceProvider);
    // Connect asynchronously to avoid blocking UI
    service.connect(roomCode).then((_) {
      state = service.isConnected;
    }).catchError((error) {
      state = false;
    });
  }

  Future<void> disconnect() async {
    final service = ref.read(websocketServiceProvider);
    await service.disconnect();
    state = false;
  }
}

// WebSocket Message Stream Provider
final websocketMessageProvider = StreamProvider<WebSocketMessage>((ref) {
  final service = ref.read(websocketServiceProvider);
  return service.messageStream;
});

// Send Message Provider
final sendMessageProvider =
    StateNotifierProvider<SendMessageNotifier, AsyncValue<void>>((ref) {
  return SendMessageNotifier(ref);
});

class SendMessageNotifier extends StateNotifier<AsyncValue<void>> {
  final Ref ref;

  SendMessageNotifier(this.ref) : super(const AsyncValue.data(null));

  Future<void> sendMessage(WebSocketMessage message) async {
    try {
      final service = ref.read(websocketServiceProvider);
      service.sendMessage(message);
      state = const AsyncValue.data(null);
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      rethrow;
    }
  }

  void sendJson(Map<String, dynamic> data) {
    try {
      final service = ref.read(websocketServiceProvider);
      service.sendJson(data);
      state = const AsyncValue.data(null);
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
    }
  }

  Future<void> sendEvent(String event, Map<String, dynamic>? data) async {
    try {
      final service = ref.read(websocketServiceProvider);
      service.sendEvent(event, data);
      state = const AsyncValue.data(null);
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      rethrow;
    }
  }
}

