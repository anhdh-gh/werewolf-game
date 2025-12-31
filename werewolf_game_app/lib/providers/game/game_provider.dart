import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:werewolf_game_app/models/game/game_state_model.dart';
import 'package:werewolf_game_app/models/game/player_model.dart';
import 'package:werewolf_game_app/models/room/user_room_model.dart';
import 'package:werewolf_game_app/models/websocket/role_action_message.dart';
import 'package:werewolf_game_app/models/websocket/vote_message.dart';
import 'package:werewolf_game_app/models/websocket/websocket_message.dart';
import 'package:werewolf_game_app/providers/websocket/websocket_provider.dart';

// Current Game State Provider
final gameStateProvider = StateProvider<GameStateModel?>((ref) => null);

// Current Player Role Provider
final playerRoleProvider = Provider<PlayerRole?>((ref) {
  final gameState = ref.watch(gameStateProvider);
  // This should be set from currentUserRoomProvider
  return null; // Will be set from user room data
});

// Current Game Phase Provider
final gamePhaseProvider = Provider<GamePhase>((ref) {
  final gameState = ref.watch(gameStateProvider);
  return gameState?.currentPhase ?? GamePhase.waiting;
});

// Send Role Action Provider
final sendRoleActionProvider =
    StateNotifierProvider<SendRoleActionNotifier, AsyncValue<void>>((ref) {
  return SendRoleActionNotifier(ref);
});

class SendRoleActionNotifier extends StateNotifier<AsyncValue<void>> {
  final Ref ref;

  SendRoleActionNotifier(this.ref) : super(const AsyncValue.data(null));

  Future<void> sendRoleAction({
    required String roomCode,
    required PlayerRole role,
    required String actionType,
    int? targetUserId,
    Map<String, dynamic>? additionalData,
  }) async {
    state = const AsyncValue.loading();

    try {
      final actionMessage = RoleActionMessage(
        roomCode: roomCode,
        role: role,
        actionType: actionType,
        targetUserId: targetUserId,
        additionalData: additionalData,
      );

      final wsMessage = WebSocketMessage(
        type: MessageType.roleAction,
        roomCode: roomCode,
        data: actionMessage.toJson(),
      );

      final sendProvider = ref.read(sendMessageProvider.notifier);
      await sendProvider.sendMessage(wsMessage);

      state = const AsyncValue.data(null);
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      rethrow;
    }
  }
}

// Send Vote Provider
final sendVoteProvider =
    StateNotifierProvider<SendVoteNotifier, AsyncValue<void>>((ref) {
  return SendVoteNotifier(ref);
});

class SendVoteNotifier extends StateNotifier<AsyncValue<void>> {
  final Ref ref;

  SendVoteNotifier(this.ref) : super(const AsyncValue.data(null));

  Future<void> sendVote({
    required String roomCode,
    required int voterId,
    int? targetUserId, // null means skip vote
  }) async {
    state = const AsyncValue.loading();

    try {
      final voteMessage = VoteMessage(
        roomCode: roomCode,
        voterId: voterId,
        targetUserId: targetUserId,
      );

      final wsMessage = WebSocketMessage(
        type: MessageType.vote,
        roomCode: roomCode,
        data: voteMessage.toJson(),
      );

      final sendProvider = ref.read(sendMessageProvider.notifier);
      await sendProvider.sendMessage(wsMessage);

      state = const AsyncValue.data(null);
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      rethrow;
    }
  }
}

// Game Action Provider (for game master actions)
final gameActionProvider =
    StateNotifierProvider<GameActionNotifier, AsyncValue<void>>((ref) {
  return GameActionNotifier(ref);
});

class GameActionNotifier extends StateNotifier<AsyncValue<void>> {
  final Ref ref;

  GameActionNotifier(this.ref) : super(const AsyncValue.data(null));

  Future<void> sendGameAction({
    required String roomCode,
    required String actionType,
    Map<String, dynamic>? data,
  }) async {
    state = const AsyncValue.loading();

    try {
      final wsMessage = WebSocketMessage(
        type: MessageType.gameStateUpdate,
        roomCode: roomCode,
        data: {
          'action': actionType,
          ...?data,
        },
      );

      final sendProvider = ref.read(sendMessageProvider.notifier);
      await sendProvider.sendMessage(wsMessage);

      state = const AsyncValue.data(null);
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      rethrow;
    }
  }
}

