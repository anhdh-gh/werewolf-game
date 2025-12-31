import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:werewolf_game_app/models/game/game_state_model.dart';
import 'package:werewolf_game_app/models/room/user_room_model.dart';
import 'package:werewolf_game_app/providers/game/game_provider.dart';
import 'package:werewolf_game_app/providers/room/room_provider.dart';
import 'package:werewolf_game_app/providers/websocket/websocket_provider.dart';

class NightPhaseScreen extends ConsumerStatefulWidget {
  final String roomCode;

  const NightPhaseScreen({super.key, required this.roomCode});

  @override
  ConsumerState<NightPhaseScreen> createState() => _NightPhaseScreenState();
}

class _NightPhaseScreenState extends ConsumerState<NightPhaseScreen> {
  final Color _goldColor = const Color(0xFFDeb887);
  final Color _glassColor = const Color(0xFF323345).withOpacity(0.85);

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
    final userRoom = ref.watch(currentUserRoomProvider);
    final currentRole = userRoom?.role;

    // Show sleep screen if not user's turn
    if (gameState?.currentActiveRole == null ||
        gameState?.currentActiveRole != currentRole?.toString().split('.').last) {
      return _buildSleepScreen();
    }

    // Show role-specific action screen
    return _buildRoleActionScreen(currentRole, gameState);
  }

  Widget _buildSleepScreen() {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.bedtime,
              size: 100,
              color: Colors.white24,
            ),
            const SizedBox(height: 20),
            const Text(
              "Everyone goes to sleep...",
              style: TextStyle(
                color: Colors.white70,
                fontSize: 20,
              ),
            ),
            const SizedBox(height: 10),
            const Text(
              "Close your eyes",
              style: TextStyle(
                color: Colors.white54,
                fontSize: 16,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRoleActionScreen(PlayerRole? role, GameStateModel? gameState) {
    switch (role) {
      case PlayerRole.guardian:
        return GuardianActionScreen(roomCode: widget.roomCode);
      case PlayerRole.wolf:
        return WolfActionScreen(roomCode: widget.roomCode);
      case PlayerRole.prophet:
        return ProphetActionScreen(roomCode: widget.roomCode);
      case PlayerRole.witch:
        return WitchActionScreen(roomCode: widget.roomCode);
      case PlayerRole.cursed:
        return CursedActionScreen(roomCode: widget.roomCode);
      case PlayerRole.mute:
        return MuteActionScreen(roomCode: widget.roomCode);
      default:
        return _buildSleepScreen();
    }
  }
}

// Base class for role action screens
abstract class BaseRoleActionScreen extends ConsumerStatefulWidget {
  final String roomCode;

  const BaseRoleActionScreen({super.key, required this.roomCode});
}

abstract class BaseRoleActionScreenState<T extends BaseRoleActionScreen>
    extends ConsumerState<T> {
  final Color _goldColor = const Color(0xFFDeb887);
  final Color _glassColor = const Color(0xFF323345).withOpacity(0.85);

  void sendAction(String actionType, int? targetUserId) {
    final userRoom = ref.read(currentUserRoomProvider);
    if (userRoom?.role != null) {
      ref.read(sendRoleActionProvider.notifier).sendRoleAction(
            roomCode: widget.roomCode,
            role: userRoom!.role!,
            actionType: actionType,
            targetUserId: targetUserId,
          );
    }
  }

  Widget buildActionContent();
}

// Guardian Action Screen
class GuardianActionScreen extends BaseRoleActionScreen {
  const GuardianActionScreen({super.key, required super.roomCode});

  @override
  ConsumerState<GuardianActionScreen> createState() => _GuardianActionScreenState();
}

class _GuardianActionScreenState
    extends BaseRoleActionScreenState<GuardianActionScreen> {
  int? _selectedPlayerId;

  @override
  Widget buildActionContent() {
    final playersAsync = ref.watch(roomPlayersProvider(widget.roomCode));

    return Column(
      children: [
        const Text(
          "GUARDIAN",
          style: TextStyle(
            color: Colors.white,
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 10),
        const Text(
          "Who do you want to protect tonight?",
          style: TextStyle(color: Colors.white70),
        ),
        const SizedBox(height: 30),
        Expanded(
          child: playersAsync.when(
            data: (players) {
              final alivePlayers = players.where((p) => p.status == PlayerStatus.notDead).toList();
              return ListView.builder(
                itemCount: alivePlayers.length,
                itemBuilder: (context, index) {
                  final player = alivePlayers[index];
                  final isSelected = _selectedPlayerId == player.userId;
                  return ListTile(
                    leading: CircleAvatar(
                      backgroundColor: isSelected ? _goldColor : Colors.grey,
                      child: Text(
                        player.username?[0].toUpperCase() ?? '?',
                        style: const TextStyle(color: Colors.black),
                      ),
                    ),
                    title: Text(
                      player.username ?? 'Unknown',
                      style: TextStyle(
                        color: isSelected ? _goldColor : Colors.white,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                    onTap: () {
                      setState(() {
                        _selectedPlayerId = player.userId;
                      });
                    },
                  );
                },
              );
            },
            loading: () => const CircularProgressIndicator(),
            error: (error, stack) => Text("Error: $error", style: const TextStyle(color: Colors.red)),
          ),
        ),
        const SizedBox(height: 20),
        SizedBox(
          width: double.infinity,
          height: 55,
          child: ElevatedButton(
            onPressed: _selectedPlayerId == null
                ? null
                : () {
                    sendAction("PROTECT", _selectedPlayerId);
                    Navigator.pop(context);
                  },
            style: ElevatedButton.styleFrom(
              backgroundColor: _goldColor,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(15),
              ),
            ),
            child: const Text(
              "DONE",
              style: TextStyle(
                color: Colors.black87,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF181920),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text("Guardian Action"),
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: buildActionContent(),
      ),
    );
  }
}

// Simplified versions of other role screens (similar structure)
class WolfActionScreen extends BaseRoleActionScreen {
  const WolfActionScreen({super.key, required super.roomCode});

  @override
  ConsumerState<WolfActionScreen> createState() => _WolfActionScreenState();
}

class _WolfActionScreenState extends BaseRoleActionScreenState<WolfActionScreen> {
  int? _selectedPlayerId;

  @override
  Widget buildActionContent() {
    return Column(
      children: [
        const Text("WOLF - Choose kill target", style: TextStyle(color: Colors.white)),
        const SizedBox(height: 20),
        Expanded(child: Container()), // Player list similar to Guardian
        ElevatedButton(
          onPressed: _selectedPlayerId == null ? null : () => sendAction("KILL", _selectedPlayerId),
          child: const Text("DONE"),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF181920),
      appBar: AppBar(title: const Text("Wolf Action")),
      body: Padding(padding: const EdgeInsets.all(20), child: buildActionContent()),
    );
  }
}

class ProphetActionScreen extends BaseRoleActionScreen {
  const ProphetActionScreen({super.key, required super.roomCode});

  @override
  ConsumerState<ProphetActionScreen> createState() => _ProphetActionScreenState();
}

class _ProphetActionScreenState extends BaseRoleActionScreenState<ProphetActionScreen> {
  @override
  Widget buildActionContent() {
    return Column(
      children: [
        const Text("PROPHET - Check player role", style: TextStyle(color: Colors.white)),
        ElevatedButton(onPressed: () => sendAction("CHECK", null), child: const Text("DONE")),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF181920),
      appBar: AppBar(title: const Text("Prophet Action")),
      body: Padding(padding: const EdgeInsets.all(20), child: buildActionContent()),
    );
  }
}

class WitchActionScreen extends BaseRoleActionScreen {
  const WitchActionScreen({super.key, required super.roomCode});

  @override
  ConsumerState<WitchActionScreen> createState() => _WitchActionScreenState();
}

class _WitchActionScreenState extends BaseRoleActionScreenState<WitchActionScreen> {
  @override
  Widget buildActionContent() {
    return Column(
      children: [
        const Text("WITCH - Save or kill?", style: TextStyle(color: Colors.white)),
        ElevatedButton(onPressed: () => sendAction("SAVE", null), child: const Text("SAVE")),
        ElevatedButton(onPressed: () => sendAction("KILL_POTION", null), child: const Text("KILL")),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF181920),
      appBar: AppBar(title: const Text("Witch Action")),
      body: Padding(padding: const EdgeInsets.all(20), child: buildActionContent()),
    );
  }
}

class CursedActionScreen extends BaseRoleActionScreen {
  const CursedActionScreen({super.key, required super.roomCode});

  @override
  ConsumerState<CursedActionScreen> createState() => _CursedActionScreenState();
}

class _CursedActionScreenState extends BaseRoleActionScreenState<CursedActionScreen> {
  @override
  Widget buildActionContent() {
    return Column(
      children: [
        const Text("CURSED - Your role reveal", style: TextStyle(color: Colors.white)),
        ElevatedButton(onPressed: () => sendAction("REVEAL", null), child: const Text("DONE")),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF181920),
      appBar: AppBar(title: const Text("Cursed Action")),
      body: Padding(padding: const EdgeInsets.all(20), child: buildActionContent()),
    );
  }
}

class MuteActionScreen extends BaseRoleActionScreen {
  const MuteActionScreen({super.key, required super.roomCode});

  @override
  ConsumerState<MuteActionScreen> createState() => _MuteActionScreenState();
}

class _MuteActionScreenState extends BaseRoleActionScreenState<MuteActionScreen> {
  int? _selectedPlayerId;

  @override
  Widget buildActionContent() {
    return Column(
      children: [
        const Text("MUTE - Choose player to mute", style: TextStyle(color: Colors.white)),
        ElevatedButton(
          onPressed: _selectedPlayerId == null ? null : () => sendAction("MUTE", _selectedPlayerId),
          child: const Text("DONE"),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF181920),
      appBar: AppBar(title: const Text("Mute Action")),
      body: Padding(padding: const EdgeInsets.all(20), child: buildActionContent()),
    );
  }
}

