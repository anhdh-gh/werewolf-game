import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:werewolf_game_app/controllers/game/game_controller.dart';
import 'package:werewolf_game_app/controllers/game/game_state.dart';
import 'package:werewolf_game_app/controllers/room/room_controller.dart';
import 'package:werewolf_game_app/widgets/waiting/player_avatar_circle.dart';
import 'dart:developer' as developer;

/// Màn hình Sói thức dậy - Chọn người để giết
class ScreenNightWolf extends ConsumerStatefulWidget {
  const ScreenNightWolf({super.key});

  @override
  ConsumerState<ScreenNightWolf> createState() => _ScreenNightWolfState();
}

class _ScreenNightWolfState extends ConsumerState<ScreenNightWolf> {
  String? _selectedPlayerId;
  bool _hasVoted = false;

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
    
    developer.log('🐺 [ScreenNightWolf] gameState.players: ${gameState.players?.length ?? 0}');
    developer.log('🐺 [ScreenNightWolf] roomState.players: ${roomState.players.length}');
    developer.log('🐺 [ScreenNightWolf] Total players: ${players.length}');
    if (players.isNotEmpty) {
      developer.log('🐺 [ScreenNightWolf] First player: ${players[0]}');
    }
    
    // Lọc players còn sống (trừ sói)
    final alivePlayers = players.where((p) {
      final isAlive = _parseBool(p['is_alive'], true);
      final isConnected = _parseBool(p['is_connected'], true);
      final role = p['role']?.toString() ?? p['initial_role']?.toString();
      final isNotWolf = role != 'WOLF' && role != 'wolf';
      
      developer.log('🐺 [ScreenNightWolf] Player ${p['player_id']}: isAlive=$isAlive, isConnected=$isConnected, role=$role, isNotWolf=$isNotWolf');
      
      return isAlive && 
             isConnected &&
             isNotWolf; // Trừ sói
    }).toList();
    
    developer.log('🐺 [ScreenNightWolf] Filtered alivePlayers: ${alivePlayers.length}');

    // Listen cho vote state
    ref.listen<GameState>(
      gameControllerProvider,
      (previous, next) {
        if (next.hasVoted && (previous?.hasVoted ?? false) == false) {
          setState(() {
            _hasVoted = true;
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
                      Icons.pets,
                      size: 60,
                      color: Colors.red,
                    ),
                    const SizedBox(height: 20),
                    Text(
                      gameState.message ?? 'Sói thức dậy',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 10),
                    const Text(
                      'Chọn một người để giết',
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
                child: _buildPlayerList(alivePlayers),
              ),

              // Action buttons
              Container(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    // Reset button (nếu đã chọn)
                    if (_selectedPlayerId != null && !_hasVoted)
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {
                            setState(() {
                              _selectedPlayerId = null;
                            });
                            ref.read(gameControllerProvider.notifier).resetVote();
                          },
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Colors.grey),
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: const Text(
                            'CHỌN LẠI',
                            style: TextStyle(
                              color: Colors.grey,
                              fontSize: 16,
                            ),
                          ),
                        ),
                      ),
                    if (_selectedPlayerId != null && !_hasVoted)
                      const SizedBox(width: 12),
                    // Vote button
                    Expanded(
                      child: ElevatedButton(
                        onPressed: _selectedPlayerId == null || _hasVoted
                            ? null
                            : () {
                                // Gửi PLAYER_VOTE
                                ref.read(gameControllerProvider.notifier)
                                    .sendPlayerVote(_selectedPlayerId!);
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.red,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: Text(
                          _hasVoted ? 'ĐÃ CHỌN' : 'CHỌN',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Done button (sau khi đã vote)
              if (_hasVoted)
                Container(
                  padding: const EdgeInsets.only(bottom: 20, left: 20, right: 20),
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

  /// Parse boolean từ int (0/1) hoặc bool
  bool _parseBool(dynamic value, bool defaultValue) {
    if (value == null) return defaultValue;
    if (value is bool) return value;
    if (value is int) return value == 1;
    return defaultValue;
  }

  Widget _buildPlayerList(List<Map<String, dynamic>> players) {
    if (players.isEmpty) {
      return const Center(
        child: Text(
          'Không có player nào để chọn',
          style: TextStyle(color: Colors.grey),
        ),
      );
    }

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
        final isProtected = _parseBool(player['is_protected'], false);

        return GestureDetector(
          onTap: _hasVoted
              ? null
              : () {
                  setState(() {
                    _selectedPlayerId = playerId;
                  });
                },
          child: Container(
            decoration: BoxDecoration(
              color: isSelected
                  ? Colors.red.withOpacity(0.3)
                  : Colors.grey[900],
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isSelected
                    ? Colors.red
                    : (isProtected ? Colors.blue : Colors.grey[700]!),
                width: isSelected ? 3 : (isProtected ? 2 : 1),
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Stack(
                  children: [
                    PlayerAvatarCircle(
                      player: player,
                      index: index,
                      avatarRadius: 40,
                      showUsername: false,
                    ),
                    if (isProtected)
                      Positioned(
                        right: 0,
                        top: 0,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            color: Colors.blue,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.shield,
                            size: 16,
                            color: Colors.white,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  username,
                  style: TextStyle(
                    color: isSelected ? Colors.red : Colors.white,
                    fontSize: 16,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  ),
                  textAlign: TextAlign.center,
                ),
                if (isProtected)
                  const Text(
                    '(Được bảo vệ)',
                    style: TextStyle(
                      color: Colors.blue,
                      fontSize: 12,
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }
}

