import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:werewolf_game_app/models/game/game_state_model.dart';
import 'package:werewolf_game_app/providers/game/game_provider.dart';
import 'package:werewolf_game_app/providers/room/room_provider.dart';
import 'package:werewolf_game_app/providers/websocket/websocket_provider.dart';

class GameMasterScreen extends ConsumerStatefulWidget {
  final String roomCode;

  const GameMasterScreen({super.key, required this.roomCode});

  @override
  ConsumerState<GameMasterScreen> createState() => _GameMasterScreenState();
}

class _GameMasterScreenState extends ConsumerState<GameMasterScreen> {
  final Color _goldColor = const Color(0xFFDeb887);
  final Color _glassColor = const Color(0xFF323345).withOpacity(0.85);

  @override
  void initState() {
    super.initState();
    // Connect to WebSocket when screen loads (async, non-blocking)
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // Connect asynchronously to avoid blocking UI
      ref.read(websocketConnectionProvider.notifier).connect(widget.roomCode);
    });
  }

  @override
  void dispose() {
    // Disconnect WebSocket when leaving
    ref.read(websocketConnectionProvider.notifier).disconnect();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final gameState = ref.watch(gameStateProvider);
    final gameActionState = ref.watch(gameActionProvider);

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
          "GAME MASTER",
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
                // Current Phase Display
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: _glassColor,
                    borderRadius: BorderRadius.circular(15),
                  ),
                  child: Column(
                    children: [
                      Text(
                        _getPhaseAnnouncement(gameState),
                        style: TextStyle(
                          color: _goldColor,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      if (gameState != null) ...[
                        const SizedBox(height: 10),
                        Text(
                          "Night ${gameState.currentNight}",
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 16,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),

                const SizedBox(height: 30),

                // Game Actions
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: _glassColor,
                    borderRadius: BorderRadius.circular(15),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Text(
                        "GAME ACTIONS",
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 20),
                      _buildActionButton(
                        "Start Night Phase",
                        () => _sendGameAction("NIGHT_START"),
                        gameActionState.isLoading,
                      ),
                      const SizedBox(height: 10),
                      _buildActionButton(
                        "Wake Up Guardian",
                        () => _sendGameAction("ROLE_WAKE_UP", {"role": "GUARDIAN"}),
                        gameActionState.isLoading,
                      ),
                      const SizedBox(height: 10),
                      _buildActionButton(
                        "Wake Up Wolves",
                        () => _sendGameAction("ROLE_WAKE_UP", {"role": "WOLF"}),
                        gameActionState.isLoading,
                      ),
                      const SizedBox(height: 10),
                      _buildActionButton(
                        "Wake Up Prophet",
                        () => _sendGameAction("ROLE_WAKE_UP", {"role": "PROPHET"}),
                        gameActionState.isLoading,
                      ),
                      const SizedBox(height: 10),
                      _buildActionButton(
                        "Wake Up Witch",
                        () => _sendGameAction("ROLE_WAKE_UP", {"role": "WITCH"}),
                        gameActionState.isLoading,
                      ),
                      const SizedBox(height: 10),
                      _buildActionButton(
                        "Wake Up Cursed",
                        () => _sendGameAction("ROLE_WAKE_UP", {"role": "CURSED"}),
                        gameActionState.isLoading,
                      ),
                      const SizedBox(height: 10),
                      _buildActionButton(
                        "Wake Up Mute",
                        () => _sendGameAction("ROLE_WAKE_UP", {"role": "MUTE"}),
                        gameActionState.isLoading,
                      ),
                      const SizedBox(height: 10),
                      _buildActionButton(
                        "Start Day Phase",
                        () => _sendGameAction("DAY_START"),
                        gameActionState.isLoading,
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 30),

                // Done Button
                SizedBox(
                  width: double.infinity,
                  height: 55,
                  child: ElevatedButton(
                    onPressed: gameActionState.isLoading
                        ? null
                        : () {
                            _sendGameAction("PHASE_DONE");
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _goldColor,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(15),
                      ),
                      elevation: 10,
                    ),
                    child: gameActionState.isLoading
                        ? const CircularProgressIndicator(color: Colors.black87)
                        : const Text(
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
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildActionButton(String label, VoidCallback onPressed, bool isLoading) {
    return ElevatedButton(
      onPressed: isLoading ? null : onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.white.withOpacity(0.1),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
      ),
      child: Text(
        label,
        style: const TextStyle(color: Colors.white),
      ),
    );
  }

  void _sendGameAction(String actionType, [Map<String, dynamic>? data]) {
    ref.read(gameActionProvider.notifier).sendGameAction(
          roomCode: widget.roomCode,
          actionType: actionType,
          data: data,
        );
  }

  String _getPhaseAnnouncement(GameStateModel? gameState) {
    if (gameState == null) {
      return "Game Starting...";
    }

    switch (gameState.currentPhase) {
      case GamePhase.waiting:
        return "Waiting for players...";
      case GamePhase.night:
        return "Night ${gameState.currentNight}: Everyone goes to sleep";
      case GamePhase.day:
        return "Day Phase: Discussion and Voting";
      case GamePhase.ended:
        return "Game Ended";
    }
  }
}

