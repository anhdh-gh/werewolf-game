import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:werewolf_game_app/providers/room/room_provider.dart';

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
  Widget build(BuildContext context) {
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
      // Bọc GestureDetector để chạm ra ngoài thì ẩn bàn phím
      body: GestureDetector(
        onTap: () => FocusScope.of(context).unfocus(),
        child: Container(
          width: double.infinity,
          height: double.infinity,
decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Color(0xFF2C2D3A), // Xám xanh đậm (trầm) ở trên
                Color(0xFF181920), // Gần như đen ở dưới đáy
              ],
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
                      style: TextStyle(
                        color: _goldColor,
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 5,
                      ),
                      // Tự động viết hoa
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

                  const SizedBox(height: 50),

                  // Error message display
                  Consumer(
                    builder: (context, ref, child) {
                      final joinState = ref.watch(joinRoomProvider);
                      return joinState.when(
                        data: (_) => const SizedBox.shrink(),
                        loading: () => const Padding(
                          padding: EdgeInsets.only(bottom: 20),
                          child: CircularProgressIndicator(color: Color(0xFFDeb887)),
                        ),
                        error: (error, stack) => Padding(
                          padding: const EdgeInsets.only(bottom: 20),
                          child: Text(
                            error.toString().replaceAll('Exception: ', ''),
                            style: const TextStyle(color: Colors.red),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      );
                    },
                  ),

                  // --- Nút Join ---
                  SizedBox(
                    width: double.infinity,
                    height: 55,
                    child: Consumer(
                      builder: (context, ref, child) {
                        final joinState = ref.watch(joinRoomProvider);
                        final isLoading = joinState.isLoading;

                        return ElevatedButton(
                          onPressed: isLoading
                              ? null
                              : () async {
                                  if (_codeController.text.isEmpty) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text("Please enter a room code"),
                                        backgroundColor: Colors.red,
                                      ),
                                    );
                                    return;
                                  }

                                  try {
                                    await ref
                                        .read(joinRoomProvider.notifier)
                                        .joinRoom(_codeController.text.trim().toUpperCase());
                                    
                                    if (context.mounted) {
                                      context.go('/room/lobby/${_codeController.text.trim().toUpperCase()}');
                                    }
                                  } catch (e) {
                                    // Error is handled by the Consumer above
                                  }
                                },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _goldColor,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(15),
                        ),
                        elevation: 5,
                      ),
                          child: isLoading
                              ? const CircularProgressIndicator(color: Colors.black87)
                              : const Text(
                                  "ENTER VILLAGE",
                                  style: TextStyle(
                                    color: Colors.black87,
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 1.0,
                                  ),
                                ),
                        );
                      },
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
