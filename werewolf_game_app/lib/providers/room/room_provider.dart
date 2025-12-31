import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:werewolf_game_app/models/room/room_model.dart';
import 'package:werewolf_game_app/models/room/user_room_model.dart';
import 'package:werewolf_game_app/models/room/role_config.dart';
import 'package:werewolf_game_app/services/api/room_api_service.dart';

// Room API Service Provider
final roomApiServiceProvider = Provider<RoomApiService>((ref) {
  return RoomApiService();
});

// Current Room Provider
final currentRoomProvider = StateProvider<RoomModel?>((ref) => null);

// Current User Room Provider (user's status in current room)
final currentUserRoomProvider = StateProvider<UserRoomModel?>((ref) => null);

// Room Players Provider
final roomPlayersProvider = FutureProvider.family<List<UserRoomModel>, String>(
  (ref, roomCode) async {
    final roomService = ref.read(roomApiServiceProvider);
    return await roomService.getRoomPlayers(roomCode);
  },
);

// Create Room Provider
final createRoomProvider =
    StateNotifierProvider<CreateRoomNotifier, AsyncValue<RoomModel?>>((ref) {
  return CreateRoomNotifier(ref);
});

class CreateRoomNotifier extends StateNotifier<AsyncValue<RoomModel?>> {
  final Ref ref;

  CreateRoomNotifier(this.ref) : super(const AsyncValue.data(null));

  Future<void> createRoom({RoleConfig? roleConfig}) async {
    state = const AsyncValue.loading();

    try {
      final roomService = ref.read(roomApiServiceProvider);
      final room = await roomService.createRoom(roleConfig: roleConfig);

      // Update current room
      ref.read(currentRoomProvider.notifier).state = room;

      state = AsyncValue.data(room);
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      rethrow;
    }
  }
}

// Join Room Provider
final joinRoomProvider =
    StateNotifierProvider<JoinRoomNotifier, AsyncValue<UserRoomModel?>>((ref) {
  return JoinRoomNotifier(ref);
});

class JoinRoomNotifier extends StateNotifier<AsyncValue<UserRoomModel?>> {
  final Ref ref;

  JoinRoomNotifier(this.ref) : super(const AsyncValue.data(null));

  Future<void> joinRoom(String roomCode) async {
    state = const AsyncValue.loading();

    try {
      final roomService = ref.read(roomApiServiceProvider);
      final userRoom = await roomService.joinRoom(roomCode);

      // Get room details
      final room = await roomService.getRoom(roomCode);
      ref.read(currentRoomProvider.notifier).state = room;

      // Update current user room
      ref.read(currentUserRoomProvider.notifier).state = userRoom;

      state = AsyncValue.data(userRoom);
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      rethrow;
    }
  }
}

// Start Game Provider
final startGameProvider =
    StateNotifierProvider<StartGameNotifier, AsyncValue<void>>((ref) {
  return StartGameNotifier(ref);
});

class StartGameNotifier extends StateNotifier<AsyncValue<void>> {
  final Ref ref;

  StartGameNotifier(this.ref) : super(const AsyncValue.data(null));

  Future<void> startGame(String roomCode, RoleConfig roleConfig) async {
    state = const AsyncValue.loading();

    try {
      final roomService = ref.read(roomApiServiceProvider);
      await roomService.startGame(roomCode, roleConfig);

      // Refresh room data
      final room = await roomService.getRoom(roomCode);
      ref.read(currentRoomProvider.notifier).state = room;

      state = const AsyncValue.data(null);
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      rethrow;
    }
  }
}

// Configure Roles Provider
final configureRolesProvider =
    StateNotifierProvider<ConfigureRolesNotifier, AsyncValue<void>>((ref) {
  return ConfigureRolesNotifier(ref);
});

class ConfigureRolesNotifier extends StateNotifier<AsyncValue<void>> {
  final Ref ref;

  ConfigureRolesNotifier(this.ref) : super(const AsyncValue.data(null));

  Future<void> configureRoles(String roomCode, RoleConfig roleConfig) async {
    state = const AsyncValue.loading();

    try {
      final roomService = ref.read(roomApiServiceProvider);
      await roomService.configureRoles(roomCode, roleConfig);

      state = const AsyncValue.data(null);
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      rethrow;
    }
  }
}

// Leave Room Provider
final leaveRoomProvider =
    StateNotifierProvider<LeaveRoomNotifier, AsyncValue<void>>((ref) {
  return LeaveRoomNotifier(ref);
});

class LeaveRoomNotifier extends StateNotifier<AsyncValue<void>> {
  final Ref ref;

  LeaveRoomNotifier(this.ref) : super(const AsyncValue.data(null));

  Future<void> leaveRoom(String roomCode) async {
    state = const AsyncValue.loading();

    try {
      final roomService = ref.read(roomApiServiceProvider);
      await roomService.leaveRoom(roomCode);

      // Clear room state
      ref.read(currentRoomProvider.notifier).state = null;
      ref.read(currentUserRoomProvider.notifier).state = null;

      state = const AsyncValue.data(null);
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      rethrow;
    }
  }
}

