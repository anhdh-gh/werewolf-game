import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:werewolf_game_app/widgets/waiting/player_avatar_circle.dart';

/// Widget hiển thị players xếp thành vòng tròn
class CircularPlayersWidget extends StatelessWidget {
  final List<Map<String, dynamic>> players;
  final int playerCount;
  final double avatarRadius;
  final Color goldColor;

  const CircularPlayersWidget({
    super.key,
    required this.players,
    required this.playerCount,
    this.avatarRadius = 40.0,
    this.goldColor = const Color(0xFFDeb887),
  });

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;
    
    // Tính toán vị trí vòng tròn
    final circlePosition = _calculateCirclePosition(
      screenWidth: screenWidth,
      screenHeight: screenHeight,
    );
    
    return Stack(
      children: List.generate(
        playerCount,
        (index) {
          final playerPosition = _calculatePlayerPosition(
            index: index,
            playerCount: playerCount,
            circlePosition: circlePosition,
            avatarRadius: avatarRadius,
          );
          
          // Lấy thông tin player nếu có
          Map<String, dynamic>? player;
          if (players.isNotEmpty && index < players.length) {
            player = players[index];
          }
          
          return Positioned(
            left: playerPosition.x,
            top: playerPosition.y,
            child: PlayerAvatarCircle(
              player: player,
              index: index,
              avatarRadius: avatarRadius,
              goldColor: goldColor,
            ),
          );
        },
      ),
    );
  }

  /// Tính toán vị trí và kích thước vòng tròn
  CirclePosition _calculateCirclePosition({
    required double screenWidth,
    required double screenHeight,
  }) {
    // Bán kính vòng tròn (tùy chỉnh theo số lượng players)
    final radius = math.min(screenWidth * 0.35, screenHeight * 0.2);
    
    // Tâm vòng tròn (ở giữa màn hình theo chiều ngang, ở dưới 1/3 theo chiều dọc)
    // Tâm nằm ở vị trí 2/3 từ trên xuống (dưới 1/3 màn hình)
    final centerX = screenWidth / 2;
    final centerY = screenHeight * 2 / 3;
    
    return CirclePosition(
      centerX: centerX,
      centerY: centerY,
      radius: radius,
    );
  }

  /// Tính toán vị trí của mỗi player trên vòng tròn
  PlayerPosition _calculatePlayerPosition({
    required int index,
    required int playerCount,
    required CirclePosition circlePosition,
    required double avatarRadius,
  }) {
    // Tính góc cho mỗi player (bắt đầu từ trên cùng, quay theo chiều kim đồng hồ)
    final angle = (index * 2 * math.pi / playerCount) - (math.pi / 2);
    
    // Tính vị trí x, y dựa trên góc và bán kính
    final x = circlePosition.centerX + 
              circlePosition.radius * math.cos(angle) - 
              avatarRadius;
    final y = circlePosition.centerY + 
              circlePosition.radius * math.sin(angle) - 
              avatarRadius;
    
    return PlayerPosition(x: x, y: y);
  }
}

/// Model cho vị trí vòng tròn
class CirclePosition {
  final double centerX;
  final double centerY;
  final double radius;

  const CirclePosition({
    required this.centerX,
    required this.centerY,
    required this.radius,
  });
}

/// Model cho vị trí player
class PlayerPosition {
  final double x;
  final double y;

  const PlayerPosition({
    required this.x,
    required this.y,
  });
}

