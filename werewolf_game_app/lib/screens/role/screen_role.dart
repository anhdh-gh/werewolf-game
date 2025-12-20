import 'package:flutter/material.dart';

class ScreenRoomSetup extends StatefulWidget {
  const ScreenRoomSetup({super.key});

  @override
  State<ScreenRoomSetup> createState() => _ScreenRoomSetupState();
}

class _ScreenRoomSetupState extends State<ScreenRoomSetup> {
  // Màu sắc chủ đạo
  final Color _goldColor = const Color(0xFFDeb887);
  final Color _rowBackgroundColor = const Color(0xFF3E4050).withOpacity(0.6);
  final Color _redAccent = const Color(0xFFE57373); // Màu đỏ cho Sói
  final Color _greenAccent = const Color(0xFF80CBC4); // Màu xanh cho Tiên tri
  final Color _orangeAccent = const Color(0xFFFFCC80); // Màu cam cho Dân

  // Dữ liệu giả lập các vai trò
  // Bạn có thể thêm vai trò mới vào list này
  List<Map<String, dynamic>> _roles = [
    {
      'name': 'WEREWOLF',
      'count': 2,
      'color': const Color(0xFFE57373),
      'icon': Icons.nights_stay,
    },
    {
      'name': 'VILLAGER',
      'count': 4,
      'color': const Color(0xFFFFCC80),
      'icon': Icons.person,
    },
    {
      'name': 'SEER',
      'count': 1,
      'color': const Color(0xFF80CBC4),
      'icon': Icons.visibility,
    },
    {
      'name': 'GUARD',
      'count': 1,
      'color': const Color(0xFFCE93D8),
      'icon': Icons.shield,
    },
    {
      'name': 'HUNTER',
      'count': 1,
      'color': const Color(0xFFA5D6A7),
      'icon': Icons.my_location,
    },
  ];

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
          "ROOM SETUP & RANDOMIZE",
          style: TextStyle(
            color: Color(0xFFDeb887), // Màu Gold cho tiêu đề
            fontWeight: FontWeight.bold,
            fontSize: 18,
            letterSpacing: 1.0,
          ),
        ),
        centerTitle: true,
      ),
      body: Container(
        width: double.infinity,
        height: double.infinity,
        // --- Background Gradient Trầm ---
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFF2C2D3A), // Xám xanh đậm
              Color(0xFF15161C), // Đen gần như tuyệt đối
            ],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 20),

                // --- Danh sách Role (Scroll được nếu danh sách dài) ---
                Expanded(
                  child: ListView.builder(
                    itemCount: _roles.length,
                    itemBuilder: (context, index) {
                      return _buildRoleRow(index);
                    },
                  ),
                ),

                const SizedBox(height: 20),

                // --- Phần Players Waiting ---
                const Text(
                  "PLAYERS WAITING",
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    letterSpacing: 1.0,
                  ),
                ),
                const SizedBox(height: 15),
                // Danh sách Avatar người chơi đang chờ
                SizedBox(
                  height: 60,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: [
                      _buildAvatarItem("A", Colors.blueGrey),
                      _buildAvatarItem("B", Colors.deepOrange),
                      _buildAvatarItem("C", Colors.purple),
                      _buildAvatarItem("D", Colors.teal),
                      _buildAvatarItem("E", Colors.brown),
                      // Thêm dấu + đại diện slot trống
                      Container(
                        width: 50,
                        height: 50,
                        margin: const EdgeInsets.only(right: 15),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: Colors.grey.withOpacity(0.3),
                          ),
                        ),
                        child: Icon(
                          Icons.add,
                          color: Colors.grey.withOpacity(0.5),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 30),

                // --- Nút Randomize & Start ---
                SizedBox(
                  width: double.infinity,
                  height: 55,
                  child: ElevatedButton(
                    onPressed: () {
                      // Xử lý bắt đầu game
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _goldColor,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 5,
                    ),
                    child: const Text(
                      "RANDOMIZE ROLES & START GAME",
                      style: TextStyle(
                        color: Colors.black87,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // Widget xây dựng 1 dòng điều chỉnh Role
  Widget _buildRoleRow(int index) {
    final role = _roles[index];
    final String name = role['name'];
    final int count = role['count'];
    final Color roleColor = role['color'];
    final IconData roleIcon = role['icon'];

    return Container(
      margin: const EdgeInsets.only(bottom: 15),
      padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 12),
      decoration: BoxDecoration(
        color: _rowBackgroundColor,
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: Colors.white10),
      ),
      child: Row(
        children: [
          // 1. Icon Role (Vòng tròn màu)
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: roleColor, width: 2),
              color: roleColor.withOpacity(0.1),
            ),
            child: Icon(roleIcon, color: roleColor, size: 20),
          ),

          const SizedBox(width: 15),

          // 2. Tên Role và Số lượng hiện tại bên cạnh tên
          Expanded(
            child: RichText(
              text: TextSpan(
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
                children: [
                  TextSpan(
                    text: "$name: ",
                    style: const TextStyle(color: Colors.white),
                  ),
                  TextSpan(text: "$count", style: TextStyle(color: _goldColor)),
                ],
              ),
            ),
          ),

          // 3. Bộ nút điều khiển (- Số lượng +)
          Row(
            children: [
              _buildControlBtn(
                icon: Icons.remove,
                onTap: () {
                  if (count > 0) {
                    setState(() {
                      _roles[index]['count'] = count - 1;
                    });
                  }
                },
              ),

              SizedBox(
                width: 40,
                child: Center(
                  child: Text(
                    "$count",
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),

              _buildControlBtn(
                icon: Icons.add,
                onTap: () {
                  setState(() {
                    _roles[index]['count'] = count + 1;
                  });
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  // Nút bấm nhỏ (Màu vàng, chữ đen)
  Widget _buildControlBtn({
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          color: _goldColor,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: Colors.black87, size: 20),
      ),
    );
  }

  // Avatar người chơi chờ
  Widget _buildAvatarItem(String label, Color color) {
    return Container(
      margin: const EdgeInsets.only(right: 15),
      child: CircleAvatar(
        radius: 25,
        backgroundColor: color.withOpacity(0.8),
        child: Text(
          label,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}
