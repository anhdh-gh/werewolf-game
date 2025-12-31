import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:werewolf_game_app/providers/room/room_provider.dart';

class ScreenNewGame extends ConsumerStatefulWidget {
  const ScreenNewGame({super.key});

  @override
  ConsumerState<ScreenNewGame> createState() => _ScreenNewGameState();
}

class _ScreenNewGameState extends ConsumerState<ScreenNewGame> {

  Color get _goldColor => const Color(0xFFDeb887);
  final Color _glassColor = const Color(0xFF323345).withOpacity(0.85);

  @override
  void initState() {
    super.initState();
    // Create room when screen loads
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _createRoom();
    });
  }

  Future<void> _createRoom() async {
    try {
      await ref.read(createRoomProvider.notifier).createRoom();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("Error creating room: ${e.toString()}"),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final createRoomState = ref.watch(createRoomProvider);
    final room = ref.watch(currentRoomProvider);

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
          "CREATE ROOM",
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
              Color(0xFF2C2D3A), // Xám xanh đậm (trầm) ở trên
              Color(0xFF181920), // Gần như đen ở dưới đáy
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              createRoomState.when(
                data: (createdRoom) {
                  final roomCode = room?.roomCode ?? createdRoom?.roomCode ?? '';
                  
                  if (roomCode.isEmpty) {
                    return const Center(
                      child: CircularProgressIndicator(color: Color(0xFFDeb887)),
                    );
                  }

                  return Column(
                    children: [
                      // --- Khung hiển thị Mã Phòng ---
                      Container(
                        margin: const EdgeInsets.symmetric(horizontal: 40),
                        padding: const EdgeInsets.all(30),
                        decoration: BoxDecoration(
                          color: _glassColor,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: _goldColor.withOpacity(0.5),
                            width: 2,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.5),
                              blurRadius: 15,
                              spreadRadius: 2,
                            ),
                          ],
                        ),
                        child: Column(
                          children: [
                            const Text(
                              "YOUR ROOM CODE",
                              style: TextStyle(
                                color: Colors.grey,
                                fontSize: 14,
                                letterSpacing: 2,
                              ),
                            ),
                            const SizedBox(height: 10),
                            Text(
                              roomCode,
                              style: TextStyle(
                                color: _goldColor,
                                fontSize: 48,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 5,
                              ),
                            ),
                            const SizedBox(height: 20),
                            // Nút Copy
                            InkWell(
                              onTap: () {
                                Clipboard.setData(ClipboardData(text: roomCode));
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text("Copied $roomCode to clipboard!"),
                                    backgroundColor: _goldColor,
                                  ),
                                );
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 20,
                                  vertical: 10,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(30),
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.copy, color: Colors.white, size: 18),
                                    SizedBox(width: 8),
                                    Text(
                                      "COPY CODE",
                                      style: TextStyle(color: Colors.white),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 50),

                      // --- Trạng thái chờ ---
                      const Text(
                        "Waiting for players...",
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 16,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                      const SizedBox(height: 20),
                      // Loading indicator
                      const CircularProgressIndicator(color: Color(0xFFDeb887)),

                      const Spacer(),

                      // --- Nút Go to Setup ---
                      Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 40,
                          vertical: 30,
                        ),
                        child: SizedBox(
                          width: double.infinity,
                          height: 55,
                          child: ElevatedButton(
                            onPressed: () {
                              context.go('/room/setup/$roomCode');
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: _goldColor,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(15),
                              ),
                              elevation: 10,
                            ),
                            child: const Text(
                              "CONFIGURE ROOM",
                              style: TextStyle(
                                color: Colors.black87,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  );
                },
                loading: () => const Center(
                  child: CircularProgressIndicator(color: Color(0xFFDeb887)),
                ),
                error: (error, stack) => Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        "Error: ${error.toString()}",
                        style: const TextStyle(color: Colors.red),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 20),
                      ElevatedButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text("Go Back"),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
