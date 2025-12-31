import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:werewolf_game_app/models/room/user_room_model.dart';
import 'package:werewolf_game_app/providers/room/room_provider.dart';

class RoleRevealScreen extends ConsumerWidget {
  final String? playerRole;

  const RoleRevealScreen({super.key, this.playerRole});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final Color _goldColor = const Color(0xFFDeb887);
    final Color _glassColor = const Color(0xFF323345).withOpacity(0.85);
    
    final userRoom = ref.watch(currentUserRoomProvider);
    final role = userRoom?.role ?? (playerRole != null ? _parseRole(playerRole!) : null);

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
          child: Padding(
            padding: const EdgeInsets.all(30),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text(
                  "YOUR ROLE",
                  style: TextStyle(
                    color: Colors.grey,
                    fontSize: 16,
                    letterSpacing: 2,
                  ),
                ),
                const SizedBox(height: 30),
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
                        _getRoleIcon(role),
                        size: 100,
                        color: _goldColor,
                      ),
                      const SizedBox(height: 20),
                      Text(
                        _getRoleName(role),
                        style: TextStyle(
                          color: _goldColor,
                          fontSize: 36,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 2,
                        ),
                      ),
                      const SizedBox(height: 20),
                      Text(
                        _getRoleDescription(role),
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 16,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 50),
                SizedBox(
                  width: double.infinity,
                  height: 55,
                  child: ElevatedButton(
                    onPressed: () {
                      context.go('/home');
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _goldColor,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(15),
                      ),
                    ),
                    child: const Text(
                      "CONTINUE",
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

  PlayerRole? _parseRole(String roleString) {
    try {
      return PlayerRole.values.firstWhere(
        (e) => e.toString().split('.').last == roleString.toUpperCase(),
      );
    } catch (e) {
      return null;
    }
  }

  IconData _getRoleIcon(PlayerRole? role) {
    switch (role) {
      case PlayerRole.wolf:
        return Icons.nights_stay;
      case PlayerRole.guardian:
        return Icons.shield;
      case PlayerRole.witch:
        return Icons.local_drink;
      case PlayerRole.prophet:
        return Icons.visibility;
      case PlayerRole.villager:
        return Icons.person;
      case PlayerRole.cursed:
        return Icons.warning;
      case PlayerRole.mute:
        return Icons.volume_off;
      case PlayerRole.desperate:
        return Icons.sentiment_very_dissatisfied;
      default:
        return Icons.help;
    }
  }

  String _getRoleName(PlayerRole? role) {
    switch (role) {
      case PlayerRole.wolf:
        return "WEREWOLF";
      case PlayerRole.guardian:
        return "GUARDIAN";
      case PlayerRole.witch:
        return "WITCH";
      case PlayerRole.prophet:
        return "PROPHET";
      case PlayerRole.villager:
        return "VILLAGER";
      case PlayerRole.cursed:
        return "CURSED";
      case PlayerRole.mute:
        return "MUTE";
      case PlayerRole.desperate:
        return "DESPERATE";
      default:
        return "UNKNOWN";
    }
  }

  String _getRoleDescription(PlayerRole? role) {
    switch (role) {
      case PlayerRole.wolf:
        return "Your goal is to eliminate all villagers. Work with other wolves at night.";
      case PlayerRole.guardian:
        return "Protect a player each night from being killed by wolves.";
      case PlayerRole.witch:
        return "You have a healing potion and a killing potion. Use them wisely.";
      case PlayerRole.prophet:
        return "Check a player's role each night to determine if they are a wolf.";
      case PlayerRole.villager:
        return "You are a regular villager. Find and vote out the wolves during the day.";
      case PlayerRole.cursed:
        return "You may become a wolf if bitten. Your role changes each night.";
      case PlayerRole.mute:
        return "Mute a player each night. They cannot speak during the next day.";
      case PlayerRole.desperate:
        return "You win only if villagers vote to eliminate you. You cannot be woken at night.";
      default:
        return "Unknown role.";
    }
  }
}

