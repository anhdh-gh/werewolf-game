import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:werewolf_game_app/models/room/role_config.dart';
import 'package:werewolf_game_app/providers/room/room_provider.dart';

class RoomSetupScreen extends ConsumerStatefulWidget {
  final String roomCode;

  const RoomSetupScreen({super.key, required this.roomCode});

  @override
  ConsumerState<RoomSetupScreen> createState() => _RoomSetupScreenState();
}

class _RoomSetupScreenState extends ConsumerState<RoomSetupScreen> {
  final Color _goldColor = const Color(0xFFDeb887);
  final Color _glassColor = const Color(0xFF323345).withOpacity(0.85);
  
  RoleConfig _roleConfig = RoleConfig();

  @override
  Widget build(BuildContext context) {
    final room = ref.watch(currentRoomProvider);
    final playersAsync = ref.watch(roomPlayersProvider(widget.roomCode));
    final startGameState = ref.watch(startGameProvider);

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          "ROOM SETUP",
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
                        "YOUR ROOM CODE",
                        style: TextStyle(
                          color: Colors.grey,
                          fontSize: 14,
                          letterSpacing: 2,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        widget.roomCode,
                        style: TextStyle(
                          color: _goldColor,
                          fontSize: 48,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 5,
                        ),
                      ),
                      const SizedBox(height: 20),
                      InkWell(
                        onTap: () {
                          Clipboard.setData(ClipboardData(text: widget.roomCode));
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text("Copied ${widget.roomCode} to clipboard!"),
                              backgroundColor: _goldColor,
                            ),
                          );
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 20,
                            vertical: 10,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(30),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.copy, color: Colors.white, size: 18),
                              SizedBox(width: 8),
                              Text(
                                "COPY CODE",
                                style: TextStyle(color: Colors.white),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 30),

                // Role Configuration
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
                        "ROLE CONFIGURATION",
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 20),
                      _buildRoleCounter("Wolf", _roleConfig.wolf, (value) {
                        setState(() {
                          _roleConfig = RoleConfig(
                            wolf: value,
                            guardian: _roleConfig.guardian,
                            witch: _roleConfig.witch,
                            prophet: _roleConfig.prophet,
                            villager: _roleConfig.villager,
                            cursed: _roleConfig.cursed,
                            mute: _roleConfig.mute,
                            desperate: _roleConfig.desperate,
                          );
                        });
                      }),
                      _buildRoleCounter("Guardian", _roleConfig.guardian, (value) {
                        setState(() {
                          _roleConfig = RoleConfig(
                            wolf: _roleConfig.wolf,
                            guardian: value,
                            witch: _roleConfig.witch,
                            prophet: _roleConfig.prophet,
                            villager: _roleConfig.villager,
                            cursed: _roleConfig.cursed,
                            mute: _roleConfig.mute,
                            desperate: _roleConfig.desperate,
                          );
                        });
                      }),
                      _buildRoleCounter("Witch", _roleConfig.witch, (value) {
                        setState(() {
                          _roleConfig = RoleConfig(
                            wolf: _roleConfig.wolf,
                            guardian: _roleConfig.guardian,
                            witch: value,
                            prophet: _roleConfig.prophet,
                            villager: _roleConfig.villager,
                            cursed: _roleConfig.cursed,
                            mute: _roleConfig.mute,
                            desperate: _roleConfig.desperate,
                          );
                        });
                      }),
                      _buildRoleCounter("Prophet", _roleConfig.prophet, (value) {
                        setState(() {
                          _roleConfig = RoleConfig(
                            wolf: _roleConfig.wolf,
                            guardian: _roleConfig.guardian,
                            witch: _roleConfig.witch,
                            prophet: value,
                            villager: _roleConfig.villager,
                            cursed: _roleConfig.cursed,
                            mute: _roleConfig.mute,
                            desperate: _roleConfig.desperate,
                          );
                        });
                      }),
                      _buildRoleCounter("Villager", _roleConfig.villager, (value) {
                        setState(() {
                          _roleConfig = RoleConfig(
                            wolf: _roleConfig.wolf,
                            guardian: _roleConfig.guardian,
                            witch: _roleConfig.witch,
                            prophet: _roleConfig.prophet,
                            villager: value,
                            cursed: _roleConfig.cursed,
                            mute: _roleConfig.mute,
                            desperate: _roleConfig.desperate,
                          );
                        });
                      }),
                      _buildRoleCounter("Cursed", _roleConfig.cursed, (value) {
                        setState(() {
                          _roleConfig = RoleConfig(
                            wolf: _roleConfig.wolf,
                            guardian: _roleConfig.guardian,
                            witch: _roleConfig.witch,
                            prophet: _roleConfig.prophet,
                            villager: _roleConfig.villager,
                            cursed: value,
                            mute: _roleConfig.mute,
                            desperate: _roleConfig.desperate,
                          );
                        });
                      }),
                      _buildRoleCounter("Mute", _roleConfig.mute, (value) {
                        setState(() {
                          _roleConfig = RoleConfig(
                            wolf: _roleConfig.wolf,
                            guardian: _roleConfig.guardian,
                            witch: _roleConfig.witch,
                            prophet: _roleConfig.prophet,
                            villager: _roleConfig.villager,
                            cursed: _roleConfig.cursed,
                            mute: value,
                            desperate: _roleConfig.desperate,
                          );
                        });
                      }),
                      _buildRoleCounter("Desperate", _roleConfig.desperate, (value) {
                        setState(() {
                          _roleConfig = RoleConfig(
                            wolf: _roleConfig.wolf,
                            guardian: _roleConfig.guardian,
                            witch: _roleConfig.witch,
                            prophet: _roleConfig.prophet,
                            villager: _roleConfig.villager,
                            cursed: _roleConfig.cursed,
                            mute: _roleConfig.mute,
                            desperate: value,
                          );
                        });
                      }),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

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

                // Start Game Button
                SizedBox(
                  width: double.infinity,
                  height: 55,
                  child: ElevatedButton(
                    onPressed: startGameState.isLoading
                        ? null
                        : () async {
                            try {
                              await ref
                                  .read(startGameProvider.notifier)
                                  .startGame(widget.roomCode, _roleConfig);
                              if (context.mounted) {
                                context.go('/game/master/${widget.roomCode}');
                              }
                            } catch (e) {
                              if (context.mounted) {
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
                      elevation: 10,
                    ),
                    child: startGameState.isLoading
                        ? const CircularProgressIndicator(color: Colors.black87)
                        : const Text(
                            "START GAME",
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
        ),
      ),
    );
  }

  Widget _buildRoleCounter(String roleName, int value, Function(int) onChanged) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            roleName,
            style: const TextStyle(color: Colors.white, fontSize: 16),
          ),
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.remove_circle, color: Colors.white),
                onPressed: value > 0
                    ? () => onChanged(value - 1)
                    : null,
              ),
              Text(
                value.toString(),
                style: TextStyle(
                  color: _goldColor,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.add_circle, color: Colors.white),
                onPressed: () => onChanged(value + 1),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

