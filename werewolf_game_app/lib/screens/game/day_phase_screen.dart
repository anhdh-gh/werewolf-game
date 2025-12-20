import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:werewolf_game_app/models/game/game_state_model.dart';
import 'package:werewolf_game_app/models/room/user_room_model.dart';
import 'package:werewolf_game_app/providers/game/game_provider.dart';
import 'package:werewolf_game_app/providers/room/room_provider.dart';
import 'package:werewolf_game_app/providers/websocket/websocket_provider.dart';

class DayPhaseScreen extends ConsumerStatefulWidget {
  final String roomCode;

  const DayPhaseScreen({super.key, required this.roomCode});

  @override
  ConsumerState<DayPhaseScreen> createState() => _DayPhaseScreenState();
}

class _DayPhaseScreenState extends ConsumerState<DayPhaseScreen> {
  final Color _goldColor = const Color(0xFFDeb887);
  final Color _glassColor = const Color(0xFF323345).withOpacity(0.85);
  int? _selectedVoteTarget;

  @override
  void initState() {
    super.initState();
    // Connect WebSocket asynchronously to avoid blocking UI
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(websocketConnectionProvider.notifier).connect(widget.roomCode);
    });
  }

  @override
  void dispose() {
    ref.read(websocketConnectionProvider.notifier).disconnect();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final gameState = ref.watch(gameStateProvider);
    final playersAsync = ref.watch(roomPlayersProvider(widget.roomCode));
    final userRoom = ref.watch(currentUserRoomProvider);
    final sendVoteState = ref.watch(sendVoteProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF181920),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text("Day Phase"),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Night Results
            if (gameState?.nightResults != null)
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
                      "NIGHT RESULTS",
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      gameState!.nightResults!['message'] ?? 'Night phase completed',
                      style: const TextStyle(color: Colors.white70),
                    ),
                    if (gameState.mutedPlayerId != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 10),
                        child: Text(
                          "Player ${gameState.mutedPlayerId} is muted!",
                          style: TextStyle(color: _goldColor),
                        ),
                      ),
                  ],
                ),
              ),

            const SizedBox(height: 30),

            // Voting Section
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
                    "VOTE TO ELIMINATE",
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 20),
                  playersAsync.when(
                    data: (players) {
                      final alivePlayers = players
                          .where((p) => p.status == PlayerStatus.notDead)
                          .toList();
                      return Column(
                        children: [
                          ...alivePlayers.map((player) {
                            final isSelected = _selectedVoteTarget == player.userId;
                            return Padding(
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              child: ListTile(
                                leading: CircleAvatar(
                                  backgroundColor:
                                      isSelected ? _goldColor : Colors.grey,
                                  child: Text(
                                    player.username?[0].toUpperCase() ?? '?',
                                    style: const TextStyle(color: Colors.black),
                                  ),
                                ),
                                title: Text(
                                  player.username ?? 'Unknown',
                                  style: TextStyle(
                                    color: isSelected ? _goldColor : Colors.white,
                                    fontWeight:
                                        isSelected ? FontWeight.bold : FontWeight.normal,
                                  ),
                                ),
                                trailing: gameState?.voteResults != null
                                    ? Text(
                                        "${gameState!.getVoteCount(player.userId)} votes",
                                        style: const TextStyle(color: Colors.white70),
                                      )
                                    : null,
                                onTap: () {
                                  setState(() {
                                    _selectedVoteTarget = player.userId;
                                  });
                                },
                              ),
                            );
                          }),
                          // Skip vote option
                          ListTile(
                            leading: const Icon(Icons.skip_next, color: Colors.grey),
                            title: const Text(
                              "Skip Vote",
                              style: TextStyle(color: Colors.grey),
                            ),
                            onTap: () {
                              setState(() {
                                _selectedVoteTarget = null;
                              });
                            },
                          ),
                        ],
                      );
                    },
                    loading: () => const CircularProgressIndicator(),
                    error: (error, stack) =>
                        Text("Error: $error", style: const TextStyle(color: Colors.red)),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 30),

            // Vote Button
            SizedBox(
              width: double.infinity,
              height: 55,
              child: ElevatedButton(
                onPressed: sendVoteState.isLoading
                    ? null
                    : () async {
                        try {
                          await ref.read(sendVoteProvider.notifier).sendVote(
                                roomCode: widget.roomCode,
                                voterId: userRoom?.userId ?? 0,
                                targetUserId: _selectedVoteTarget,
                              );
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text("Vote submitted"),
                                backgroundColor: Colors.green,
                              ),
                            );
                          }
                        } catch (e) {
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text("Error: ${e.toString()}"),
                                backgroundColor: Colors.red,
                              ),
                            );
                          }
                        }
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: _goldColor,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(15),
                  ),
                ),
                child: sendVoteState.isLoading
                    ? const CircularProgressIndicator(color: Colors.black87)
                    : const Text(
                        "SUBMIT VOTE",
                        style: TextStyle(
                          color: Colors.black87,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
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

