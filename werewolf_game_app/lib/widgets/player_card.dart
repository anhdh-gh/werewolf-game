// werewolf_game_app/lib/widgets/player_card.dart
import 'package:flutter/material.dart';

class PlayerCard extends StatelessWidget {
  final String username;
  final bool isHost;
  final Color goldColor;
  final Color glassColor;
  final String? avatarUrl; // Dành cho tương lai khi có ảnh

  const PlayerCard({
    super.key,
    required this.username,
    required this.isHost,
    required this.goldColor,
    required this.glassColor,
    this.avatarUrl,
  });

  @override
  Widget build(BuildContext context) {
    // Lấy chữ cái đầu của username làm avatar
    final avatarLetter = username.isNotEmpty 
        ? username[0].toUpperCase() 
        : '?';
    
    return Container(
      width: 100,
      margin: const EdgeInsets.only(right: 15),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: glassColor,
        borderRadius: BorderRadius.circular(15),
        border: Border.all(
          color: isHost 
              ? goldColor.withOpacity(0.8) 
              : goldColor.withOpacity(0.3),
          width: isHost ? 2.5 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: isHost 
                ? goldColor.withOpacity(0.3) 
                : Colors.black.withOpacity(0.3),
            blurRadius: isHost ? 10 : 5,
            spreadRadius: isHost ? 2 : 0,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Avatar với chữ cái đầu
          Stack(
            clipBehavior: Clip.none,
            children: [
              CircleAvatar(
                radius: 32,
                backgroundColor: isHost 
                    ? goldColor.withOpacity(0.9) 
                    : goldColor.withOpacity(0.6),
                backgroundImage: avatarUrl != null 
                    ? NetworkImage(avatarUrl!) 
                    : null,
                child: avatarUrl == null
                    ? Text(
                        avatarLetter,
                        style: const TextStyle(
                          color: Colors.black,
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                        ),
                      )
                    : null,
              ),
              // Badge "HOST" cho chủ phòng
              if (isHost)
                Positioned(
                  right: -5,
                  top: -5,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: goldColor,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: Colors.black,
                        width: 1.5,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.3),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: const Text(
                      'HOST',
                      style: TextStyle(
                        color: Colors.black,
                        fontSize: 8,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 10),
          // Username
          Flexible(
            child: Text(
              username,
              style: TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: isHost ? FontWeight.bold : FontWeight.normal,
              ),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}