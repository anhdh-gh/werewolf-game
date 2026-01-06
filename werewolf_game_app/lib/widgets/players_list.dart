// werewolf_game_app/lib/widgets/players_list.dart
import 'package:flutter/material.dart';
import 'package:werewolf_game_app/widgets/player_card.dart';

class PlayersList extends StatelessWidget {
  final List<Map<String, dynamic>> players;
  final int playerCount;
  final Color goldColor;
  final Color glassColor;

  const PlayersList({
    super.key,
    required this.players,
    required this.playerCount,
    required this.goldColor,
    required this.glassColor,
  });

  @override
  Widget build(BuildContext context) {
    // Tính số lượng thực tế
    final actualCount = playerCount > 0 ? playerCount : players.length;
    
    if (actualCount == 0) {
      return const SizedBox.shrink();
    }

    return Column(
      children: [
        Text(
          'Players ($actualCount)',
          style: TextStyle(
            color: goldColor,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 20),
        SizedBox(
          height: 140,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: actualCount,
            itemBuilder: (context, index) {
              // Nếu có players list chi tiết, dùng nó
              if (players.isNotEmpty && index < players.length) {
                final player = players[index];
                final username = player['name'] ?? 
                                player['username'] ?? 
                                player['player_name'] ?? 
                                'Player ${index + 1}';
                
                // Xác định chủ phòng từ backend data
                final isPlayerHost = player['is_host'] ?? 
                                    player['isHost'] ?? 
                                    false;
                
                return PlayerCard(
                  username: username,
                  isHost: isPlayerHost,
                  goldColor: goldColor,
                  glassColor: glassColor,
                  avatarUrl: player['avatar_url'] ?? 
                            player['avatarUrl'] ?? 
                            player['avatar'],
                );
              }
              
              // Nếu chỉ có count, hiển thị placeholder
              return PlayerCard(
                username: 'Player ${index + 1}',
                isHost: false,
                goldColor: goldColor,
                glassColor: glassColor,
              );
            },
          ),
        ),
      ],
    );
  }
}