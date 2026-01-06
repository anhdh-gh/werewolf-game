// werewolf_game_app/lib/screens/startgame/join_game.dart
import 'dart:developer' as developer;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:werewolf_game_app/controllers/room/room_controller.dart';

/// Screen để join vào room
/// UI only - Business logic được xử lý bởi RoomController
class ScreenJoinGame extends ConsumerStatefulWidget {
  const ScreenJoinGame({super.key});

  @override
  ConsumerState<ScreenJoinGame> createState() => _ScreenJoinGameState();
}

class _ScreenJoinGameState extends ConsumerState<ScreenJoinGame> {
  final TextEditingController _codeController = TextEditingController();
  final Color _goldColor = const Color(0xFFDeb887);
  final Color _glassColor = const Color(0xFF323345).withOpacity(0.9);

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  /// Join room - gọi controller để xử lý business logic
  Future<void> _joinRoom() async {
    final roomCode = _codeController.text.trim().toUpperCase();
    if (roomCode.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter a room code'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    FocusScope.of(context).unfocus();

    try {
      developer.log('🎮 [ScreenJoinGame] Starting join room process - roomCode: $roomCode');
      
      // Gọi controller để join room
      await ref.read(roomControllerProvider.notifier).joinRoom(roomCode);
      developer.log('🎮 [ScreenJoinGame] Join room completed successfully');
      
      // Đợi một chút để WebSocket có thời gian nhận events
      await Future.delayed(const Duration(milliseconds: 500));
      
      // Kiểm tra state trước khi navigate
      final currentState = ref.read(roomControllerProvider);
      developer.log('🎮 [ScreenJoinGame] State before navigate - roomCode: ${currentState.roomCode}, isConnected: ${currentState.isConnected}, players: ${currentState.players.length}, playerCount: ${currentState.playerCount}');
      
      // Navigate sang new_game sau khi join thành công
      // Dùng GoRouter thay vì Navigator
      if (mounted) {
        developer.log('🎮 [ScreenJoinGame] Navigating to /new-game');
        context.push('/new-game');
      }
    } catch (e) {
      developer.log('❌ [ScreenJoinGame] Error joining room: $e');
      developer.log('❌ [ScreenJoinGame] Error stack trace: ${StackTrace.current}');
      
      // Error đã được set trong controller state
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to join room: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Watch room state để hiển thị loading
    final roomState = ref.watch(roomControllerProvider);
    final isLoading = roomState.isLoading;

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
          "JOIN ROOM",
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
      ),
      body: GestureDetector(
        onTap: () => FocusScope.of(context).unfocus(),
        child: Container(
          width: double.infinity,
          height: double.infinity,
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Color(0xFF2C2D3A), Color(0xFF181920)],
            ),
          ),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 30),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    "ENTER ROOM CODE",
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.5,
                    ),
                  ),
                  const SizedBox(height: 30),

                  // --- TextField Nhập Mã ---
                  Container(
                    decoration: BoxDecoration(
                      color: _glassColor,
                      borderRadius: BorderRadius.circular(15),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.3),
                          blurRadius: 10,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),
                    child: TextField(
                      controller: _codeController,
                      textAlign: TextAlign.center,
                      enabled: !isLoading,
                      style: TextStyle(
                        color: _goldColor,
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 5,
                      ),
                      textCapitalization: TextCapitalization.characters,
                      cursorColor: _goldColor,
                      decoration: InputDecoration(
                        hintText: "X Y Z 1 2",
                        hintStyle: TextStyle(
                          color: Colors.grey.withOpacity(0.5),
                          letterSpacing: 5,
                        ),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(
                          vertical: 20,
                          horizontal: 20,
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 20),

                  // --- Error Message từ state ---
                  if (roomState.errorMessage != null)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      child: Text(
                        roomState.errorMessage!,
                        style: const TextStyle(color: Colors.red, fontSize: 14),
                        textAlign: TextAlign.center,
                      ),
                    ),

                  const SizedBox(height: 30),

                  // --- Nút Join ---
                  SizedBox(
                    width: double.infinity,
                    height: 55,
                    child: ElevatedButton(
                      onPressed: isLoading ? null : _joinRoom,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: isLoading ? Colors.grey : _goldColor,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(15),
                        ),
                        elevation: 5,
                      ),
                      child: isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  Colors.white,
                                ),
                              ),
                            )
                          : const Text(
                              "ENTER VILLAGE",
                              style: TextStyle(
                                color: Colors.black87,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 1.0,
                              ),
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
