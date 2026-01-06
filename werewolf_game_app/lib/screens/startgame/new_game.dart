// werewolf_game_app/lib/screens/startgame/new_game.dart
import 'dart:developer' as developer;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:werewolf_game_app/controllers/room/room_controller.dart';
import 'package:werewolf_game_app/controllers/room/room_state.dart';
import 'package:werewolf_game_app/widgets/players_list.dart';

/// Screen hiển thị room (cho cả chủ phòng và người join)
/// UI chỉ - Business logic được xử lý bởi RoomController
class ScreenNewGame extends ConsumerStatefulWidget {
  final String? roomCode;
  final String? websocketUrl;

  const ScreenNewGame({
    super.key,
    this.roomCode,
    this.websocketUrl,
  });

  @override
  ConsumerState<ScreenNewGame> createState() => _ScreenNewGameState();
}

class _ScreenNewGameState extends ConsumerState<ScreenNewGame> {
  Color get _goldColor => const Color(0xFFDeb887);
  final Color _glassColor = const Color(0xFF323345).withOpacity(0.85);
  
  // TextEditingController cho max_players
  final TextEditingController _maxPlayersController = TextEditingController(text: '4');
  final FocusNode _maxPlayersFocusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    developer.log('🎮 [ScreenNewGame] initState - roomCode: ${widget.roomCode}, websocketUrl: ${widget.websocketUrl}');
    
    // Nếu có roomCode và websocketUrl từ widget -> join với params (backward compatibility)
    // Nếu không có -> KHÔNG tự động tạo phòng, đợi người dùng nhấn nút CREATE ROOM
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final currentState = ref.read(roomControllerProvider);
      developer.log('🎮 [ScreenNewGame] PostFrameCallback - currentState.roomCode: ${currentState.roomCode}, isLoading: ${currentState.isLoading}');
      
      if (widget.roomCode != null && widget.websocketUrl != null) {
        developer.log('🎮 [ScreenNewGame] Joining with params - roomCode: ${widget.roomCode}');
        ref.read(roomControllerProvider.notifier).joinRoomWithParams(
          roomCode: widget.roomCode!,
          websocketUrl: widget.websocketUrl!,
        );
      }
      // Bỏ phần tự động tạo phòng - đợi người dùng nhấn nút CREATE ROOM
    });
  }

  @override
  void dispose() {
    _maxPlayersController.dispose();
    _maxPlayersFocusNode.dispose();
    super.dispose();
  }

  /// Hàm tạo phòng với max_players từ TextField
  void _createRoom() {
    final maxPlayersText = _maxPlayersController.text.trim();
    if (maxPlayersText.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter number of players'),
          duration: Duration(seconds: 2),
        ),
      );
      return;
    }

    final maxPlayers = int.tryParse(maxPlayersText);
    if (maxPlayers == null || maxPlayers < 2 || maxPlayers > 20) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Number of players must be between 2 and 20'),
          duration: Duration(seconds: 2),
        ),
      );
      return;
    }

    // Gọi createRoom với maxPlayers từ TextField
    ref.read(roomControllerProvider.notifier).createRoom(maxPlayers: maxPlayers);
  }

  /// Hiển thị dialog xác nhận rời phòng
  void _showLeaveRoomDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Leave Room'),
        content: const Text('Are you sure you want to leave this room?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              await ref.read(roomControllerProvider.notifier).leaveRoom();
              if (mounted) {
                context.pop(); // Quay về màn hình trước
              }
            },
            child: const Text(
              'Leave',
              style: TextStyle(color: Colors.red),
            ),
          ),
        ],
      ),
    );
  }

  /// Copy room code to clipboard
  void _copyRoomCode(String? roomCode) {
    if (roomCode != null) {
      Clipboard.setData(ClipboardData(text: roomCode));
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Room code copied to clipboard!'),
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  /// Hiển thị error dialog
  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Error'),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              ref.read(roomControllerProvider.notifier).clearError();
              // Retry create room nếu chưa có roomCode
              final currentState = ref.read(roomControllerProvider);
              if (currentState.roomCode == null) {
                // Lấy maxPlayers từ TextField
                final maxPlayersText = _maxPlayersController.text.trim();
                final maxPlayers = int.tryParse(maxPlayersText) ?? 4;
                ref.read(roomControllerProvider.notifier).createRoom(maxPlayers: maxPlayers);
              } else {
                // Người join quay về
                context.pop();
              }
            },
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Watch room state từ controller
    final roomState = ref.watch(roomControllerProvider);
    
    // Log state changes
    developer.log('🎮 [ScreenNewGame] Build - roomCode: ${roomState.roomCode}, isLoading: ${roomState.isLoading}, isConnected: ${roomState.isConnected}, error: ${roomState.errorMessage}');
    developer.log('🎮 [ScreenNewGame] Players - count: ${roomState.playerCount}, list length: ${roomState.players.length}');
    if (roomState.players.isNotEmpty) {
      developer.log('🎮 [ScreenNewGame] First player: ${roomState.players[0]}');
    }

    // Hiển thị error dialog nếu có error
    ref.listen<RoomState>(
      roomControllerProvider,
      (previous, next) {
        developer.log('🎮 [ScreenNewGame] State changed - roomCode: ${next.roomCode}, isLoading: ${next.isLoading}, isConnected: ${next.isConnected}');
        
        if (next.errorMessage != null && previous?.errorMessage != next.errorMessage) {
          developer.log('❌ [ScreenNewGame] Error detected: ${next.errorMessage}');
          _showErrorDialog(next.errorMessage!);
        }
        // Navigate to role reveal screen khi nhận GAME_DATA_FLOW với phase "ALL_VIEW_ROLE"
        if (next.gameData != null && previous?.gameData != next.gameData) {
          final gameData = next.gameData!;
          final phase = gameData['phase'] as String?;
          
          developer.log('📊 [ScreenNewGame] GAME_DATA_FLOW received - phase: $phase');
          developer.log('📊 [ScreenNewGame] Current state - readyPlayers: ${next.readyPlayers}, maxPlayers: ${next.maxPlayers}, joinedPlayers: ${next.joinedPlayers}');
          
          // Chỉ navigate khi phase là "ALL_VIEW_ROLE"
          if (phase == 'ALL_VIEW_ROLE' && mounted) {
            developer.log('📊 [ScreenNewGame] Navigating to role reveal screen');
            context.push('/role-reveal');
          }
        }
      },
    );

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
          onPressed: _showLeaveRoomDialog,
        ),
        title: const Text(
          "ROOM",
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        actions: [
          if (roomState.roomCode != null)
            IconButton(
              icon: const Icon(Icons.exit_to_app, color: Colors.white),
              onPressed: _showLeaveRoomDialog,
              tooltip: 'Leave Room',
            ),
        ],
      ),
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
          child: Column(
            children: [
              const Spacer(),
              
              // --- Hiển thị form tạo phòng nếu chưa có roomCode ---
              if (roomState.roomCode == null && !roomState.isLoading) ...[
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
                        "CREATE ROOM",
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 2,
                        ),
                      ),
                      const SizedBox(height: 20),
                      TextField(
                        controller: _maxPlayersController,
                        focusNode: _maxPlayersFocusNode,
                        keyboardType: TextInputType.number,
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly,
                        ],
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                        ),
                        decoration: InputDecoration(
                          labelText: 'Number of Players',
                          labelStyle: TextStyle(
                            color: Colors.grey[400],
                          ),
                          hintText: 'Enter number of players (2-20)',
                          hintStyle: TextStyle(
                            color: Colors.grey[600],
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: BorderSide(
                              color: _goldColor.withOpacity(0.5),
                              width: 2,
                            ),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: BorderSide(
                              color: _goldColor,
                              width: 2,
                            ),
                          ),
                          filled: true,
                          fillColor: Colors.white.withOpacity(0.1),
                        ),
                      ),
                      const SizedBox(height: 20),
                      SizedBox(
                        width: double.infinity,
                        height: 55,
                        child: ElevatedButton(
                          onPressed: _createRoom,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _goldColor,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(15),
                            ),
                            elevation: 10,
                          ),
                          child: const Text(
                            "CREATE ROOM",
                            style: TextStyle(
                              color: Colors.black87,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              // --- Khung hiển thị Mã Phòng (chỉ hiển thị khi đã có roomCode) ---
              if (roomState.roomCode != null)
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
                        "ROOM CODE",
                        style: TextStyle(
                          color: Colors.grey,
                          fontSize: 14,
                          letterSpacing: 2,
                        ),
                      ),
                      const SizedBox(height: 10),
                      roomState.isLoading
                          ? const CircularProgressIndicator(
                              color: Color(0xFFDeb887),
                            )
                          : Text(
                              roomState.roomCode ?? '---',
                              style: TextStyle(
                                color: _goldColor,
                                fontSize: 48,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 5,
                              ),
                            ),
                      const SizedBox(height: 20),
                      InkWell(
                        onTap: roomState.roomCode != null 
                            ? () => _copyRoomCode(roomState.roomCode) 
                            : null,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 20,
                            vertical: 10,
                          ),
                          decoration: BoxDecoration(
                            color: roomState.roomCode != null
                                ? Colors.white.withOpacity(0.1)
                                : Colors.grey.withOpacity(0.3),
                            borderRadius: BorderRadius.circular(30),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.copy,
                                color: roomState.roomCode != null 
                                    ? Colors.white 
                                    : Colors.grey,
                                size: 18,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                "COPY CODE",
                                style: TextStyle(
                                  color: roomState.roomCode != null 
                                      ? Colors.white 
                                      : Colors.grey,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

              const SizedBox(height: 30),

              // --- Trạng thái chờ ---
              if (roomState.isLoading)
                const Text(
                  "Creating room...",
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 16,
                    fontStyle: FontStyle.italic,
                  ),
                )
              else if (roomState.roomCode != null)
                Column(
                  children: [
                    Text(
                      roomState.playerCount > 0 
                          ? "Waiting for more players..." 
                          : "Waiting for players...",
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 16,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                    if (roomState.playerCount == 0) ...[
                      const SizedBox(height: 20),
                      const CircularProgressIndicator(color: Color(0xFFDeb887)),
                    ],
                  ],
                )
              else if (roomState.errorMessage != null)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 40),
                  child: Text(
                    roomState.errorMessage!,
                    style: const TextStyle(
                      color: Colors.red,
                      fontSize: 14,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),

              // --- Danh sách người chơi ---
              // Hiển thị nếu có roomCode và (có playerCount > 0 hoặc có players list)
              Builder(
                builder: (context) {
                  developer.log('🎮 [ScreenNewGame] Checking players list display - roomCode: ${roomState.roomCode}, playerCount: ${roomState.playerCount}, players.length: ${roomState.players.length}');
                  
                  if (roomState.roomCode != null && 
                      (roomState.playerCount > 0 || roomState.players.isNotEmpty)) {
                    return Column(
                      children: [
                        const SizedBox(height: 30),
                        PlayersList(
                          players: roomState.players,
                          playerCount: roomState.playerCount > 0 
                              ? roomState.playerCount 
                              : roomState.players.length,
                          goldColor: _goldColor,
                          glassColor: _glassColor,
                        ),
                      ],
                    );
                  } else if (roomState.roomCode != null) {
                    // Debug: Log nếu không có players
                    developer.log('🎮 [ScreenNewGame] RoomCode exists but no players - roomCode: ${roomState.roomCode}');
                    return const SizedBox.shrink();
                  }
                  return const SizedBox.shrink();
                },
              ),

              const Spacer(),

              // --- Action Buttons ---
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 40,
                  vertical: 30,
                ),
                child: Column(
                  children: [
                    // Button READY (cho tất cả người chơi)
                    if (roomState.roomCode != null && !roomState.isReady)
                      SizedBox(
                        width: double.infinity,
                        height: 55,
                        child: ElevatedButton(
                          onPressed: () {
                            ref.read(roomControllerProvider.notifier).sendPlayerReady();
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _goldColor,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(15),
                            ),
                            elevation: 10,
                          ),
                          child: const Text(
                            "READY",
                            style: TextStyle(
                              color: Colors.black87,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),

                    // Hiển thị trạng thái ready
                    if (roomState.isReady)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 15),
                        child: Text(
                          "You are ready!",
                          style: TextStyle(
                            color: _goldColor,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),

                    // Hiển thị số lượng ready / maxPlayers
                    if (roomState.roomCode != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 15),
                        child: Text(
                          "Ready: ${roomState.readyPlayers} / ${roomState.maxPlayers}",
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 14,
                          ),
                        ),
                      ),

                    // Button LEAVE ROOM
                    if (roomState.roomCode != null) ...[
                      if (roomState.isReady || roomState.readyPlayers > 0) 
                        const SizedBox(height: 15),
                      SizedBox(
                        width: double.infinity,
                        height: 55,
                        child: OutlinedButton(
                          onPressed: _showLeaveRoomDialog,
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Colors.red, width: 2),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(15),
                            ),
                          ),
                          child: const Text(
                            "LEAVE ROOM",
                            style: TextStyle(
                              color: Colors.red,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}