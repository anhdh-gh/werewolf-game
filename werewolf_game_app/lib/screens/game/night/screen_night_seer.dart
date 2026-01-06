import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:werewolf_game_app/controllers/game/game_controller.dart';
import 'package:werewolf_game_app/controllers/game/game_state.dart';
import 'package:werewolf_game_app/controllers/room/room_controller.dart';
import 'package:werewolf_game_app/widgets/waiting/player_avatar_circle.dart';
import 'dart:developer' as developer;

/// Màn hình Tiên tri thức dậy - Xem role của 1 player
class ScreenNightSeer extends ConsumerStatefulWidget {
  const ScreenNightSeer({super.key});

  @override
  ConsumerState<ScreenNightSeer> createState() => _ScreenNightSeerState();
}

class _ScreenNightSeerState extends ConsumerState<ScreenNightSeer> {
  String? _selectedPlayerId;
  String? _viewedRole;
  bool _hasViewed = false;

  @override
  Widget build(BuildContext context) {
    final gameState = ref.watch(gameControllerProvider);
    final roomState = ref.watch(roomControllerProvider);
    
    // Fallback: lấy từ gameState.players hoặc roomState.players
    // Nếu gameState.players trống, dùng roomState.players và merge với role nếu có
    List<Map<String, dynamic>> players = gameState.players ?? [];
    
    if (players.isEmpty && roomState.players.isNotEmpty) {
      // Merge players từ RoomState với role từ GameState nếu có
      players = roomState.players.map((roomPlayer) {
        // Tìm player tương ứng trong gameState.players để lấy role
        Map<String, dynamic>? gamePlayer;
        if (gameState.players != null && gameState.players!.isNotEmpty) {
          try {
            gamePlayer = gameState.players!.firstWhere(
              (p) => p['player_id']?.toString() == roomPlayer['player_id']?.toString(),
              orElse: () => <String, dynamic>{},
            );
            if (gamePlayer.isEmpty) {
              gamePlayer = null;
            }
          } catch (e) {
            gamePlayer = null;
          }
        }
        
        // Nếu gameState.players trống (chưa có thông tin từ game), mặc định is_alive = true
        // Vì đây là đầu game, tất cả players nên còn sống
        // Chỉ set is_alive = false nếu gamePlayer có và rõ ràng là false
        final isAliveValue = gamePlayer != null 
            ? gamePlayer['is_alive'] 
            : (gameState.players == null || gameState.players!.isEmpty 
                ? true  // Đầu game, mặc định còn sống
                : (roomPlayer['is_alive'] != null ? roomPlayer['is_alive'] : true));
        
        return <String, dynamic>{
          'player_id': roomPlayer['player_id'],
          'username': roomPlayer['username'] ?? roomPlayer['name'],
          'role': (gamePlayer != null ? gamePlayer['role']?.toString() : null) ?? roomPlayer['role']?.toString(),
          'initial_role': (gamePlayer != null ? gamePlayer['initial_role']?.toString() : null) ?? roomPlayer['initial_role']?.toString(),
          'is_alive': _parseBool(isAliveValue, true), // Mặc định true nếu không có thông tin
          'is_muted': _parseBool((gamePlayer != null ? gamePlayer['is_muted'] : null) ?? roomPlayer['is_muted'], false),
          'is_protected': _parseBool((gamePlayer != null ? gamePlayer['is_protected'] : null) ?? roomPlayer['is_protected'], false),
          'is_connected': _parseBool((gamePlayer != null ? gamePlayer['is_connected'] : null) ?? roomPlayer['is_connected'], true),
        };
      }).toList();
    }
    
    developer.log('🔮 [ScreenNightSeer] gameState.players: ${gameState.players?.length ?? 0}');
    developer.log('🔮 [ScreenNightSeer] roomState.players: ${roomState.players.length}');
    developer.log('🔮 [ScreenNightSeer] Total players: ${players.length}');
    
    // Lọc players còn sống (trừ chính mình nếu cần)
    final alivePlayers = players.where((p) {
      final isAlive = _parseBool(p['is_alive'], true);
      final isConnected = _parseBool(p['is_connected'], true);
      return isAlive && isConnected;
    }).toList();

    // Listen cho viewed role từ backend response
    ref.listen<GameState>(
      gameControllerProvider,
      (previous, next) {
        if (next.viewedRole != null && previous?.viewedRole != next.viewedRole) {
          setState(() {
            _viewedRole = next.viewedRole;
            _hasViewed = true;
          });
        }
      },
    );

    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.95),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Header với message
              Container(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    const Icon(
                      Icons.visibility,
                      size: 60,
                      color: Color(0xFFDeb887),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      gameState.message ?? 'Tiên tri thức dậy',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 10),
                    const Text(
                      'Chọn một người để xem role',
                      style: TextStyle(
                        color: Colors.grey,
                        fontSize: 16,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),

              // Danh sách players
              Expanded(
                child: _hasViewed
                    ? _buildViewedResult()
                    : _buildPlayerList(alivePlayers),
              ),

              // Action buttons
              if (!_hasViewed)
                Container(
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      Expanded(
                        child: ElevatedButton(
                          onPressed: _selectedPlayerId == null
                              ? null
                              : () {
                                  // Gửi PLAYER_INFO để xem role
                                  ref.read(gameControllerProvider.notifier)
                                      .sendPlayerInfo(targetId: _selectedPlayerId);
                                },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFDeb887),
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: const Text(
                            'XEM ROLE',
                            style: TextStyle(
                              color: Colors.black,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

              // Done button (sau khi đã xem)
              if (_hasViewed)
                Container(
                  padding: const EdgeInsets.all(20),
                  child: ElevatedButton(
                    onPressed: () {
                      // Gửi PLAYER_DONE
                      ref.read(gameControllerProvider.notifier).sendPlayerDone();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFDeb887),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 40,
                        vertical: 16,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'XONG',
                      style: TextStyle(
                        color: Colors.black,
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
    );
  }

  Widget _buildPlayerList(List<Map<String, dynamic>> players) {
    return GridView.builder(
      padding: const EdgeInsets.all(20),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
        childAspectRatio: 0.8,
      ),
      itemCount: players.length,
      itemBuilder: (context, index) {
        final player = players[index];
        final playerId = player['player_id']?.toString() ?? '';
        final username = player['username'] as String? ?? 'Unknown';
        final isSelected = _selectedPlayerId == playerId;

        return GestureDetector(
          onTap: () {
            setState(() {
              _selectedPlayerId = playerId;
            });
          },
          child: Container(
            decoration: BoxDecoration(
              color: isSelected
                  ? const Color(0xFFDeb887).withOpacity(0.3)
                  : Colors.grey[900],
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isSelected
                    ? const Color(0xFFDeb887)
                    : Colors.grey[700]!,
                width: isSelected ? 3 : 1,
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                PlayerAvatarCircle(
                  player: player,
                  index: index,
                  avatarRadius: 40,
                  showUsername: false,
                ),
                const SizedBox(height: 12),
                Text(
                  username,
                  style: TextStyle(
                    color: isSelected ? const Color(0xFFDeb887) : Colors.white,
                    fontSize: 16,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  /// Parse boolean từ int (0/1) hoặc bool
  bool _parseBool(dynamic value, bool defaultValue) {
    if (value == null) return defaultValue;
    if (value is bool) return value;
    if (value is int) return value == 1;
    return defaultValue;
  }

  Widget _buildViewedResult() {
    final gameState = ref.watch(gameControllerProvider);
    final roomState = ref.watch(roomControllerProvider);
    
    // Lấy players với fallback
    final players = gameState.players ?? roomState.players;
    
    final selectedPlayer = players.firstWhere(
      (p) => p['player_id']?.toString() == _selectedPlayerId?.toString(),
      orElse: () => <String, dynamic>{},
    );
    final username = selectedPlayer['username'] as String? ?? 
                     selectedPlayer['name'] as String? ?? 
                     'Unknown';

    return Center(
      child: Container(
        padding: const EdgeInsets.all(30),
        margin: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.grey[900],
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: const Color(0xFFDeb887),
            width: 2,
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.visibility,
              size: 80,
              color: Color(0xFFDeb887),
            ),
            const SizedBox(height: 20),
            Text(
              username,
              style: const TextStyle(
                color: Color(0xFFDeb887),
                fontSize: 28,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Role:',
              style: TextStyle(
                color: Colors.grey,
                fontSize: 18,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              _viewedRole?.toUpperCase() ?? 'UNKNOWN',
              style: const TextStyle(
                color: Color(0xFFDeb887),
                fontSize: 32,
                fontWeight: FontWeight.bold,
                letterSpacing: 2,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

