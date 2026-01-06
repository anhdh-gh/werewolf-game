import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:werewolf_game_app/controllers/role_reveal/role_reveal_state.dart';
import 'package:werewolf_game_app/controllers/room/room_controller.dart';
import 'dart:developer' as developer;

/// Provider cho RoleRevealController
final roleRevealControllerProvider = 
    StateNotifierProvider.autoDispose<RoleRevealController, RoleRevealState>((ref) {
  return RoleRevealController(ref);
});

/// Controller quản lý business logic cho Role Reveal
/// Tách biệt hoàn toàn khỏi UI
class RoleRevealController extends StateNotifier<RoleRevealState> {
  final Ref _ref;

  RoleRevealController(this._ref) : super(const RoleRevealState()) {
    _initialize();
  }

  void _initialize() {
    final roomState = _ref.read(roomControllerProvider);
    final gameData = roomState.gameData;
    
    int timeRemaining = 10;
    if (gameData != null && gameData.containsKey('time')) {
      timeRemaining = gameData['time'] as int? ?? 10;
    }
    
    state = state.copyWith(timeRemaining: timeRemaining);
    
    // Auto close after timeRemaining seconds
    Future.delayed(Duration(seconds: timeRemaining), () {
      if (!state.hasNavigatedAway) {
        developer.log('⏰ [RoleRevealController] Auto closing after ${timeRemaining}s');
        state = state.copyWith(hasNavigatedAway: true);
      }
    });
  }

  /// Reveal role từ gameData
  void revealRole() {
    final roomState = _ref.read(roomControllerProvider);
    final gameData = roomState.gameData;

    if (gameData != null) {
      final role = _getRoleName(gameData);
      developer.log('🎴 [RoleRevealController] Revealing role: $role');
      state = state.copyWith(
        revealedRole: role,
        isRevealed: true,
      );
    }
  }

  /// Parse role name từ gameData
  String _getRoleName(Map<String, dynamic> gameData) {
    developer.log('🔍 [RoleRevealController] Parsing role from gameData: ${gameData.keys}');
    
    // Thử lấy role trực tiếp từ gameData
    if (gameData.containsKey('role') && gameData['role'] != null) {
      final role = gameData['role'].toString();
      if (role.isNotEmpty && role != 'null') {
        developer.log('✅ [RoleRevealController] Found role in gameData.role: $role');
        return role.toUpperCase();
      }
    }
    
    // Thử lấy từ player_role
    if (gameData.containsKey('player_role') && gameData['player_role'] != null) {
      final role = gameData['player_role'].toString();
      if (role.isNotEmpty && role != 'null') {
        developer.log('✅ [RoleRevealController] Found role in gameData.player_role: $role');
        return role.toUpperCase();
      }
    }
    
    // Thử lấy từ RoomState.players trước (có thể đã được cập nhật)
    final roomState = _ref.read(roomControllerProvider);
    if (roomState.players.isNotEmpty) {
      // Tìm player có role không null
      for (var player in roomState.players) {
        final role = player['role']?.toString() ?? 
                    player['initial_role']?.toString();
        if (role != null && role.isNotEmpty && role != 'null') {
          developer.log('✅ [RoleRevealController] Found role in RoomState.players: $role');
          return role.toUpperCase();
        }
      }
    }
    
    // Thử lấy từ data.role
    if (gameData.containsKey('data') && gameData['data'] is Map) {
      final data = gameData['data'] as Map<String, dynamic>;
      
      // Thử lấy role trực tiếp từ data
      if (data.containsKey('role') && data['role'] != null) {
        final role = data['role'].toString();
        if (role.isNotEmpty && role != 'null') {
          developer.log('✅ [RoleRevealController] Found role in data.role: $role');
          return role.toUpperCase();
        }
      }
      
      // Thử tìm role từ players list trong data
      if (data.containsKey('players') && data['players'] is List) {
        final players = data['players'] as List;
        developer.log('🔍 [RoleRevealController] Found ${players.length} players in data.players');
        
        // Tìm player có role không null
        for (var player in players) {
          if (player is Map) {
            final role = player['role']?.toString() ?? 
                        player['initial_role']?.toString();
            if (role != null && role.isNotEmpty && role != 'null') {
              developer.log('✅ [RoleRevealController] Found role in data.players: $role');
              return role.toUpperCase();
            }
          }
        }
      }
    }
    
    developer.log('⚠️ [RoleRevealController] Could not find role in gameData. Keys: ${gameData.keys}');
    return "UNKNOWN";
  }

  /// Mark as navigated away
  void markNavigatedAway() {
    if (!state.hasNavigatedAway) {
      developer.log('🚪 [RoleRevealController] Marking as navigated away');
      state = state.copyWith(hasNavigatedAway: true);
    }
  }
}

