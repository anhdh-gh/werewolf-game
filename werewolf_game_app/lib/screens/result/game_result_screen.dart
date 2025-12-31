import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:werewolf_game_app/models/game/game_state_model.dart';
import 'package:werewolf_game_app/providers/game/game_provider.dart';
import 'package:werewolf_game_app/providers/room/room_provider.dart';

class GameResultScreen extends ConsumerWidget {
  final String roomCode;

  const GameResultScreen({super.key, required this.roomCode});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final Color _goldColor = const Color(0xFFDeb887);
    final Color _glassColor = const Color(0xFF323345).withOpacity(0.85);
    
    final gameState = ref.watch(gameStateProvider);
    final room = ref.watch(currentRoomProvider);
    final isOwner = room?.ownerId != null; // Check if current user is owner

    return Scaffold(
      backgroundColor: const Color(0xFF181920),
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFF2C2D3A),
              Color(0xFF181920),
            ],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(30),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const SizedBox(height: 40),
                
                // Winner Display
                Container(
                  padding: const EdgeInsets.all(40),
                  decoration: BoxDecoration(
                    color: _glassColor,
                    borderRadius: BorderRadius.circular(30),
                    border: Border.all(
                      color: _goldColor.withOpacity(0.5),
                      width: 3,
                    ),
                  ),
                  child: Column(
                    children: [
                      Icon(
                        _getWinnerIcon(gameState?.winnerType),
                        size: 100,
                        color: _goldColor,
                      ),
                      const SizedBox(height: 20),
                      Text(
                        _getWinnerText(gameState?.winnerType),
                        style: TextStyle(
                          color: _goldColor,
                          fontSize: 36,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 2,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 20),
                      Text(
                        _getWinnerMessage(gameState?.winnerType),
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 16,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 40),

                // Final Roles (if available)
                if (gameState != null && gameState.players.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: _glassColor,
                      borderRadius: BorderRadius.circular(15),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          "FINAL ROLES",
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 15),
                        ...gameState.players.map((player) {
                          return Padding(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            child: Row(
                              children: [
                                CircleAvatar(
                                  backgroundColor: _goldColor,
                                  child: Text(
                                    player.username[0].toUpperCase(),
                                    style: const TextStyle(color: Colors.black),
                                  ),
                                ),
                                const SizedBox(width: 15),
                                Expanded(
                                  child: Text(
                                    player.username,
                                    style: const TextStyle(color: Colors.white),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 5,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Text(
                                    _getRoleDisplayName(player.role),
                                    style: const TextStyle(color: Colors.white70),
                                  ),
                                ),
                              ],
                            ),
                          );
                        }),
                      ],
                    ),
                  ),

                const SizedBox(height: 40),

                // Action Buttons
                if (isOwner)
                  SizedBox(
                    width: double.infinity,
                    height: 55,
                    child: ElevatedButton(
                      onPressed: () {
                        // TODO: Implement new game logic
                        context.go('/home');
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _goldColor,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(15),
                        ),
                      ),
                      child: const Text(
                        "NEW GAME",
                        style: TextStyle(
                          color: Colors.black87,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),

                const SizedBox(height: 15),

                SizedBox(
                  width: double.infinity,
                  height: 55,
                  child: ElevatedButton(
                    onPressed: () {
                      context.go('/home');
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white.withOpacity(0.1),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(15),
                      ),
                    ),
                    child: const Text(
                      "BACK TO HOME",
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  IconData _getWinnerIcon(WinnerType? winnerType) {
    switch (winnerType) {
      case WinnerType.wolves:
        return Icons.nights_stay;
      case WinnerType.villagers:
        return Icons.celebration;
      case WinnerType.desperate:
        return Icons.sentiment_very_satisfied;
      default:
        return Icons.help;
    }
  }

  String _getWinnerText(WinnerType? winnerType) {
    switch (winnerType) {
      case WinnerType.wolves:
        return "WOLVES WIN!";
      case WinnerType.villagers:
        return "VILLAGERS WIN!";
      case WinnerType.desperate:
        return "DESPERATE WINS!";
      default:
        return "GAME ENDED";
    }
  }

  String _getWinnerMessage(WinnerType? winnerType) {
    switch (winnerType) {
      case WinnerType.wolves:
        return "The wolves have eliminated all villagers!";
      case WinnerType.villagers:
        return "The villagers have found and eliminated all wolves!";
      case WinnerType.desperate:
        return "The desperate player has achieved their goal!";
      default:
        return "The game has ended.";
    }
  }

  String _getRoleDisplayName(dynamic role) {
    if (role == null) return "Unknown";
    final roleString = role.toString().split('.').last;
    return roleString.toUpperCase();
  }
}

