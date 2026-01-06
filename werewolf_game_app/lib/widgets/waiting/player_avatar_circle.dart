import 'package:flutter/material.dart';

/// Widget hiển thị avatar hình tròn cho player với username bên dưới
class PlayerAvatarCircle extends StatelessWidget {
  final Map<String, dynamic>? player;
  final int index;
  final double avatarRadius;
  final Color goldColor;
  final bool showUsername; // Có hiển thị username không

  const PlayerAvatarCircle({
    super.key,
    this.player,
    required this.index,
    required this.avatarRadius,
    this.goldColor = const Color(0xFFDeb887),
    this.showUsername = true,
  });

  @override
  Widget build(BuildContext context) {
    final username = _getUsername();
    final playerId = _getPlayerId();
    final isHost = _isHost();
    final isAlive = _isAlive();

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Avatar với player_id
        Container(
          width: avatarRadius * 2,
          height: avatarRadius * 2,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(
              color: isHost 
                  ? goldColor.withOpacity(0.9)
                  : goldColor.withOpacity(0.5),
              width: isHost ? 3 : 2,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.5),
                blurRadius: 8,
                spreadRadius: 2,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: ClipOval(
            child: _buildAvatarContent(playerId, isHost, isAlive),
          ),
        ),
        // Username bên dưới
        if (showUsername) ...[
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.6),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              username,
              style: TextStyle(
                color: goldColor,
                fontSize: 12,
                fontWeight: FontWeight.bold,
                shadows: [
                  Shadow(
                    color: Colors.black.withOpacity(0.8),
                    blurRadius: 4,
                  ),
                ],
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ],
    );
  }

  /// Xây dựng nội dung avatar - hiển thị player_id
  Widget _buildAvatarContent(String playerId, bool isHost, bool isAlive) {
    // Nếu player đã chết, làm mờ
    final opacity = isAlive ? 1.0 : 0.5;
    
    return Container(
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: isHost 
            ? goldColor.withOpacity(0.9 * opacity)
            : goldColor.withOpacity(0.6 * opacity),
      ),
      child: Opacity(
        opacity: opacity,
        child: Center(
          child: Text(
            playerId,
            style: TextStyle(
              color: Colors.black,
              fontSize: avatarRadius * 0.6,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ),
    );
  }

  /// Lấy player_id từ player data
  String _getPlayerId() {
    if (player != null) {
      return player!['player_id']?.toString() ?? 
             player!['playerId']?.toString() ?? 
             '${index + 1}';
    }
    return '${index + 1}';
  }

  /// Lấy username từ player data
  String _getUsername() {
    if (player != null) {
      return player!['name'] ?? 
             player!['username'] ?? 
             player!['player_name'] ?? 
             'Player ${index + 1}';
    }
    return 'Player ${index + 1}';
  }

  /// Kiểm tra xem có phải host không
  bool _isHost() {
    if (player == null) return false;
    final value = player!['is_host'] ?? player!['isHost'];
    if (value == null) return false;
    // Xử lý cả int (0/1) và bool
    if (value is bool) return value;
    if (value is int) return value == 1;
    return false;
  }

  /// Kiểm tra player còn sống không
  bool _isAlive() {
    if (player == null) return true;
    final value = player!['is_alive'] ?? player!['isAlive'];
    if (value == null) return true;
    // Xử lý cả int (0/1) và bool
    if (value is bool) return value;
    if (value is int) return value == 1;
    return true;
  }
}
