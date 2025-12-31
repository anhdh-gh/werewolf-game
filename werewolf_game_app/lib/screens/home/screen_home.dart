import 'package:flutter/material.dart';
import 'package:curved_navigation_bar/curved_navigation_bar.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:werewolf_game_app/providers/auth/auth_provider.dart';
import 'package:werewolf_game_app/screens/startgame/join_game.dart';
import 'package:werewolf_game_app/screens/startgame/new_game.dart';

class ScreenHome extends ConsumerStatefulWidget {
  const ScreenHome({super.key});

  @override
  ConsumerState<ScreenHome> createState() => _ScreenHomeState();
}

class _ScreenHomeState extends ConsumerState<ScreenHome> {
  int _page = 0;
  final GlobalKey<CurvedNavigationBarState> _bottomNavigationKey = GlobalKey();

  final Color _goldColor = const Color(0xFFDeb887);
  final Color _glassColor = const Color(0xFF323345).withOpacity(0.85);
  final Color _iconColor = const Color(0xFFEEEEEE);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          image: DecorationImage(
            // Dùng lại ảnh nền Werewolf của bạn
            image: AssetImage('images/img_home2.png'),
            fit: BoxFit.cover,
          ),
        ),
        child: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 10),
              // --- Header (Menu & Icons) ---
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // User info or Menu
                    Consumer(
                      builder: (context, ref, child) {
                        final user = ref.watch(currentUserProvider);
                        if (user != null) {
                          return Row(
                            children: [
                              CircleAvatar(
                                radius: 18,
                                backgroundColor: _goldColor,
                                child: Text(
                                  user.username[0].toUpperCase(),
                                  style: const TextStyle(
                                    color: Colors.black,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    user.username,
                                    style: TextStyle(
                                      color: _iconColor,
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  Text(
                                    user.email,
                                    style: TextStyle(
                                      color: Colors.grey[400],
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          );
                        }
                        return IconButton(
                          icon: Icon(Icons.menu, color: _iconColor, size: 30),
                          onPressed: () {
                            context.go('/role');
                          },
                        );
                      },
                    ),
                    // Icons phải (Bell & Settings & Logout)
                    Row(
                      children: [
                        _buildNotificationIcon(),
                        const SizedBox(width: 15),
                        Consumer(
                          builder: (context, ref, child) {
                            final user = ref.watch(currentUserProvider);
                            if (user != null) {
                              return IconButton(
                                icon: Icon(Icons.logout, color: _iconColor, size: 28),
                                onPressed: () async {
                                  final logout = ref.read(logoutProvider);
                                  logout();
                                  if (context.mounted) {
                                    context.go('/');
                                  }
                                },
                              );
                            }
                            return Icon(Icons.settings, color: _iconColor, size: 28);
                          },
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 40),

              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: _buildGameButton(
                            title: "NEW GAME",
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => ScreenNewGame(),
                                ),
                              );
                            },
                          ),
                        ),
                        const SizedBox(width: 15),
                        Expanded(
                          child: _buildGameButton(
                            title: "JOIN GAME",
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => ScreenJoinGame(),
                                ),
                              );
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 15),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),

      // // --- Curved Navigation Bar ---
      // bottomNavigationBar: CurvedNavigationBar(
      //   key: _bottomNavigationKey,
      //   index: 0,
      //   height: 60.0,
      //   items: <Widget>[
      //     Icon(Icons.home, size: 30, color: _goldColor),
      //     Icon(Icons.grid_view_rounded, size: 30, color: Colors.grey),
      //     Icon(Icons.person, size: 30, color: Colors.grey),
      //   ],
      //   color: const Color(0xFF252634), // Màu của thanh bar
      //   buttonBackgroundColor: const Color(
      //     0xFF252634,
      //   ), // Màu của nút tròn nổi lên
      //   backgroundColor: Colors.transparent, // Để nhìn xuyên thấu ảnh nền
      //   animationCurve: Curves.easeInOut,
      //   animationDuration: const Duration(milliseconds: 400),
      //   onTap: (index) {
      //     setState(() {
      //       _page = index;
      //     });
      //   },
      //   letIndexChange: (index) => true,
      // ),
    );
  }

  // Widget con: Nút bấm (Glassmorphism style nhẹ)
  Widget _buildGameButton({
    required String title,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 55,
        decoration: BoxDecoration(
          color: _glassColor, // Màu nền bán trong suốt
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white10),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.3),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Center(
          child: Text(
            title,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontFamily: 'Roboto',
              letterSpacing: 1.0,
            ),
          ),
        ),
      ),
    );
  }

  // Widget con: Icon thông báo có chấm đỏ
  Widget _buildNotificationIcon() {
    return Stack(
      children: [
        Icon(Icons.notifications, color: _iconColor, size: 28),
        Positioned(
          right: 0,
          top: 0,
          child: Container(
            padding: const EdgeInsets.all(2),
            decoration: BoxDecoration(
              color: Colors.redAccent,
              borderRadius: BorderRadius.circular(6),
            ),
            constraints: const BoxConstraints(minWidth: 10, minHeight: 10),
          ),
        ),
      ],
    );
  }
}
