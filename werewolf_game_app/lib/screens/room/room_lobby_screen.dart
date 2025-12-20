import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:werewolf_game_app/providers/room/room_provider.dart';

class RoomLobbyScreen extends ConsumerWidget {
  final String roomCode;

  const RoomLobbyScreen({super.key, required this.roomCode});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final Color _goldColor = const Color(0xFFDeb887);
    final Color _glassColor = const Color(0xFF323345).withOpacity(0.85);
    
    final room = ref.watch(currentRoomProvider);
    final playersAsync = ref.watch(roomPlayersProvider(roomCode));
    final userRoom = ref.watch(currentUserRoomProvider);

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
          onPressed: () async {
            try {
              await ref.read(leaveRoomProvider.notifier).leaveRoom(roomCode);
              if (context.mounted) {
                context.go('/home');
              }
            } catch (e) {
              if (context.mounted) {
                Navigator.pop(context);
              }
            }
          },
        ),
        title: const Text(
          "ROOM LOBBY",
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
      ),
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
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                // Room Code Display
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 20),
                  padding: const EdgeInsets.all(30),
                  decoration: BoxDecoration(
                    color: _glassColor,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: _goldColor.withOpacity(0.5),
                      width: 2,
                    ),
                  ),
                  child: Column(
                    children: [
                      const Text(
                        "ROOM CODE",
                        style: TextStyle(
                          color: Colors.grey,
                          fontSize: 14,
                          letterSpacing: 2,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        roomCode,
                        style: TextStyle(
                          color: _goldColor,
                          fontSize: 48,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 5,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 30),

                // Players List
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
                        "PLAYERS",
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 15),
                      playersAsync.when(
                        data: (players) {
                          if (players.isEmpty) {
                            return const Text(
                              "Waiting for players...",
                              style: TextStyle(color: Colors.grey),
                            );
                          }
                          return Column(
                            children: players.map((player) {
                              return Padding(
                                padding: const EdgeInsets.symmetric(vertical: 8),
                                child: Row(
                                  children: [
                                    CircleAvatar(
                                      backgroundColor: _goldColor,
                                      child: Text(
                                        player.username?[0].toUpperCase() ?? '?',
                                        style: const TextStyle(
                                          color: Colors.black,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 15),
                                    Expanded(
                                      child: Text(
                                        player.username ?? 'Unknown',
                                        style: const TextStyle(color: Colors.white),
                                      ),
                                    ),
                                    if (player.isOwner)
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 10,
                                          vertical: 5,
                                        ),
                                        decoration: BoxDecoration(
                                          color: _goldColor,
                                          borderRadius: BorderRadius.circular(15),
                                        ),
                                        child: const Text(
                                          "OWNER",
                                          style: TextStyle(
                                            color: Colors.black,
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                              );
                            }).toList(),
                          );
                        },
                        loading: () => const CircularProgressIndicator(color: Color(0xFFDeb887)),
                        error: (error, stack) => Text(
                          "Error loading players: $error",
                          style: const TextStyle(color: Colors.red),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 30),

                // Waiting message
                const Text(
                  "Waiting for owner to start the game...",
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 16,
                    fontStyle: FontStyle.italic,
                  ),
                ),
                const SizedBox(height: 20),
                const CircularProgressIndicator(color: Color(0xFFDeb887)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

