import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:werewolf_game_app/controllers/role_reveal/role_reveal_controller.dart';
import 'package:werewolf_game_app/controllers/role_reveal/role_reveal_state.dart';
import 'dart:math' as math;

/// Màn hình reveal role với animation card xoay và flip
/// UI chỉ - Business logic được xử lý bởi RoleRevealController
class ScreenRoleReveal extends ConsumerStatefulWidget {
  const ScreenRoleReveal({super.key});

  @override
  ConsumerState<ScreenRoleReveal> createState() => _ScreenRoleRevealState();
}

class _ScreenRoleRevealState extends ConsumerState<ScreenRoleReveal>
    with TickerProviderStateMixin {
  late AnimationController _rotationController;
  late AnimationController _flipController;
  late AnimationController _scaleController;
  late AnimationController _glowController;
  
  late Animation<double> _rotationAnimation;
  late Animation<double> _flipAnimation;
  late Animation<double> _scaleAnimation;
  late Animation<double> _glowAnimation;

  final Color _goldColor = const Color(0xFFDeb887);

  @override
  void initState() {
    super.initState();
    _setupAnimations();
    _startAnimationSequence();
  }

  void _setupAnimations() {
    // 1. Rotation Animation - Xoay từ nhanh đến chậm (2.5s, 3 vòng)
    _rotationController = AnimationController(
      duration: const Duration(milliseconds: 2500),
      vsync: this,
    );

    _rotationAnimation = Tween<double>(
      begin: 0,
      end: 2 * math.pi * 3, // Xoay 3 vòng
    ).animate(CurvedAnimation(
      parent: _rotationController,
      curve: Curves.easeOut,
    ));

    // 2. Flip Animation - Lật card 3D (0.5s sau khi xoay xong)
    _flipController = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );

    _flipAnimation = Tween<double>(
      begin: 0,
      end: math.pi,
    ).animate(CurvedAnimation(
      parent: _flipController,
      curve: Curves.easeInOut,
    ));

    // 3. Scale Animation - Phóng to nhỏ khi reveal
    _scaleController = AnimationController(
      duration: const Duration(milliseconds: 400),
      vsync: this,
    );

    _scaleAnimation = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.0, end: 1.15).chain(
          CurveTween(curve: Curves.easeOut),
        ),
        weight: 50,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.15, end: 1.0).chain(
          CurveTween(curve: Curves.easeIn),
        ),
        weight: 50,
      ),
    ]).animate(_scaleController);

    // 4. Glow Animation - Hiệu ứng phát sáng
    _glowController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat(reverse: true);

    _glowAnimation = Tween<double>(
      begin: 0.3,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _glowController,
      curve: Curves.easeInOut,
    ));
  }

  void _startAnimationSequence() {
    // Bước 1: Xoay card
    _rotationController.forward().then((_) {
      // Bước 2: Lật card và reveal role
      ref.read(roleRevealControllerProvider.notifier).revealRole();
      _flipController.forward().then((_) {
        // Bước 3: Scale animation
        _scaleController.forward();
      });
    });
  }

  @override
  void dispose() {
    _rotationController.dispose();
    _flipController.dispose();
    _scaleController.dispose();
    _glowController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(roleRevealControllerProvider);
    
    // Listen for navigation trigger
    ref.listen<RoleRevealState>(
      roleRevealControllerProvider,
      (previous, next) {
        if (next.hasNavigatedAway && (previous == null || !previous.hasNavigatedAway)) {
          context.go('/game');
        }
      },
    );

    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFF2C2D3A),
              Color(0xFF181920),
            ],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: AnimatedBuilder(
              animation: Listenable.merge([
                _rotationAnimation,
                _flipAnimation,
                _scaleAnimation,
                _glowAnimation,
              ]),
              builder: (context, child) {
                return Transform.scale(
                  scale: _scaleAnimation.value,
                  child: Transform(
                    alignment: Alignment.center,
                    transform: Matrix4.identity()
                      ..setEntry(3, 2, 0.001) // Perspective
                      ..rotateY(_flipAnimation.value),
                    child: Transform.rotate(
                      angle: _rotationAnimation.value,
                      child: _buildCard(state),
                    ),
                  ),
                );
              },
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCard(RoleRevealState state) {
    // Nếu đang flip, hiển thị mặt sau hoặc mặt trước
    final isFlipped = _flipAnimation.value > math.pi / 2;
    
    return Container(
      width: 280,
      height: 400,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          // Glow effect
          BoxShadow(
            color: _goldColor.withOpacity(_glowAnimation.value * 0.8),
            blurRadius: 30 * _glowAnimation.value,
            spreadRadius: 10 * _glowAnimation.value,
          ),
          // Normal shadow
          BoxShadow(
            color: Colors.black.withOpacity(0.5),
            blurRadius: 20,
            spreadRadius: 5,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: isFlipped 
            ? Transform(
                // Đảo ngược text khi card đã flip để chữ không bị ngược
                alignment: Alignment.center,
                transform: Matrix4.identity()..scale(-1.0, 1.0),
                child: _buildCardFront(state),
              )
            : _buildCardBack(),
      ),
    );
  }

  // Mặt sau card - Design đẹp với pattern
  Widget _buildCardBack() {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            _goldColor.withOpacity(0.9),
            _goldColor.withOpacity(0.7),
            _goldColor.withOpacity(0.5),
          ],
        ),
      ),
      child: Stack(
        children: [
          // Pattern background
          CustomPaint(
            painter: _CardPatternPainter(_goldColor),
            size: Size.infinite,
          ),
          // Center icon
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.help_outline,
                  size: 120,
                  color: Colors.black87.withOpacity(0.6),
                ),
                const SizedBox(height: 20),
                Text(
                  "?",
                  style: TextStyle(
                    fontSize: 80,
                    fontWeight: FontWeight.w900,
                    color: Colors.black87.withOpacity(0.4),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Mặt trước card - Hiển thị role
  Widget _buildCardFront(RoleRevealState state) {
    if (!state.isRevealed || state.revealedRole == null) {
      return _buildCardBack();
    }

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            const Color(0xFF323345).withOpacity(0.95),
            const Color(0xFF2C2D3A).withOpacity(0.95),
          ],
        ),
        border: Border.all(
          color: _goldColor.withOpacity(0.5),
          width: 2,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(30),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Decorative element
            Container(
              width: 60,
              height: 4,
              decoration: BoxDecoration(
                color: _goldColor,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 30),
            const Text(
              "YOUR ROLE",
              style: TextStyle(
                color: Colors.grey,
                fontSize: 16,
                letterSpacing: 3,
                fontWeight: FontWeight.w300,
              ),
            ),
            const SizedBox(height: 30),
            Text(
              state.revealedRole!,
              style: TextStyle(
                color: _goldColor,
                fontSize: 40,
                fontWeight: FontWeight.w900,
                letterSpacing: 2,
                shadows: [
                  Shadow(
                    color: _goldColor.withOpacity(0.5),
                    blurRadius: 15,
                  ),
                ],
              ),
              textAlign: TextAlign.center,
            ),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: () {
                  ref.read(roleRevealControllerProvider.notifier).markNavigatedAway();
                  context.go('/game');
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: _goldColor,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 5,
                ),
                child: const Text(
                  "CONTINUE",
                  style: TextStyle(
                    color: Colors.black87,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Custom painter cho pattern trên card back
class _CardPatternPainter extends CustomPainter {
  final Color color;

  _CardPatternPainter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color.withOpacity(0.1)
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;

    // Vẽ pattern xoắn ốc hoặc đường cong
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width * 0.4;

    for (int i = 0; i < 8; i++) {
      final angle = (i * math.pi * 2) / 8;
      final start = Offset(
        center.dx + math.cos(angle) * radius * 0.3,
        center.dy + math.sin(angle) * radius * 0.3,
      );
      final end = Offset(
        center.dx + math.cos(angle) * radius,
        center.dy + math.sin(angle) * radius,
      );
      canvas.drawLine(start, end, paint);
    }

    // Vẽ vòng tròn ở giữa
    canvas.drawCircle(center, radius * 0.2, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
