import 'package:flutter/material.dart';

class AuthTabItem extends StatelessWidget {
  final String title;
  final bool isActive;
  final VoidCallback onTap;

  const AuthTabItem({
    super.key,
    required this.title,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final Color goldColor = const Color(0xFFDeb887);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        color: Colors.transparent,
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: TextStyle(
                color: isActive ? goldColor : Colors.grey[600],
                fontSize: 22,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 8),
            if (isActive) Container(height: 3, width: 40, color: goldColor),
          ],
        ),
      ),
    );
  }
}
