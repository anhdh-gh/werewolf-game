import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:werewolf_game_app/controllers/room/room_controller.dart';
import 'package:werewolf_game_app/controllers/room/room_state.dart';
import 'package:werewolf_game_app/controllers/game/game_controller.dart';
import 'package:werewolf_game_app/controllers/game/game_state.dart';
import 'package:werewolf_game_app/widgets/waiting/circular_players_widget.dart';
import 'dart:developer' as developer;

/// Màn hình chờ với background game và players xếp thành vòng tròn
/// UI chỉ - Logic được tách ra các widget riêng
class ScreenGame extends ConsumerStatefulWidget {
  const ScreenGame({super.key});

  @override
  ConsumerState<ScreenGame> createState() => _ScreenGameState();
}

class _ScreenGameState extends ConsumerState<ScreenGame> {
  @override
  void initState() {
    super.initState();
    // Set WebSocket service cho GameController
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final roomController = ref.read(roomControllerProvider.notifier);
      final wsService = roomController.wsService;
      if (wsService != null) {
        ref.read(gameControllerProvider.notifier).setWebSocketService(wsService);
        developer.log('🔌 [ScreenGame] WebSocket service set for GameController');
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final roomState = ref.watch(roomControllerProvider);
    final gameState = ref.watch(gameControllerProvider);
    
    final players = gameState.players ?? roomState.players;
    final playerCount = roomState.playerCount > 0 ? roomState.playerCount : players.length;
    final actualPlayerCount = players.isNotEmpty ? players.length : playerCount;
    
    // Listen GAME_DATA_FLOW từ RoomController và xử lý
    ref.listen<RoomState>(
      roomControllerProvider,
      (previous, next) {
        if (next.gameData != null && previous?.gameData != next.gameData) {
          final gameData = next.gameData;
          if (gameData != null) {
            final phase = gameData['phase'] as String?;
            
            developer.log('📊 [ScreenGame] GAME_DATA_FLOW received - phase: $phase');
            
            // Xử lý GAME_DATA_FLOW trong GameController
            ref.read(gameControllerProvider.notifier).handleGameDataFlow(gameData);
            
            // Navigate theo phase
            if (phase == 'NIGHT_SEER' && mounted) {
              developer.log('📊 [ScreenGame] Navigating to NIGHT_SEER');
              context.push('/game/night/seer');
            } else if (phase == 'NIGHT_WOLF' && mounted) {
              developer.log('📊 [ScreenGame] Navigating to NIGHT_WOLF');
              context.push('/game/night/wolf');
            }
          }
        }
      },
    );

    // Listen cho PLAYER_INFO response (khi Tiên tri xem role)
    // Backend sẽ gửi GAME_DATA_FLOW với role trong data khi trả về PLAYER_INFO
    ref.listen<GameState>(
      gameControllerProvider,
      (previous, next) {
        // Nếu nhận được role từ backend response (sau khi gửi PLAYER_INFO)
        if (next.gameData != null) {
          final gameData = next.gameData!;
          // Backend có thể trả về role trong data.role hoặc data.target_role
          final role = gameData['role'] as String? ?? 
                      gameData['target_role'] as String? ??
                      (gameData['data'] as Map<String, dynamic>?)?['role'] as String?;
          if (role != null && previous?.viewedRole != role) {
            ref.read(gameControllerProvider.notifier).setViewedRole(role);
          }
        }
      },
    );

    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          image: DecorationImage(
            image: AssetImage('images/bg_game.png'),
            fit: BoxFit.cover,
          ),
        ),
        child: Stack(
          children: [
            // Hiển thị players
            if (actualPlayerCount > 0)
              CircularPlayersWidget(
                players: players,
                playerCount: actualPlayerCount,
              ),
            
            // Hiển thị message nếu có
            if (gameState.message != null)
              Positioned(
                top: 50,
                left: 0,
                right: 0,
                child: Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.7),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      gameState.message!,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

