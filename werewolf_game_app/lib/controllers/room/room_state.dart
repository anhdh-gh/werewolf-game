/// State model cho Room
/// Chứa tất cả state liên quan đến room
class RoomState {
  final String? roomCode;
  final bool isLoading;
  final String? errorMessage;
  final List<Map<String, dynamic>> players;
  final int playerCount;
  final bool isConnected;
  final int joinedPlayers; // Số người đã JOIN_ROOM
  final int readyPlayers; // Số người đã PLAYER_READY
  final bool isReady; // Trạng thái ready của user hiện tại
  final int maxPlayers; // Số người chơi tối đa
  final Map<String, dynamic>? gameData; // Data từ GAME_DATA_FLOW event

  const RoomState({
    this.roomCode,
    this.isLoading = false,
    this.errorMessage,
    this.players = const [],
    this.playerCount = 0,
    this.isConnected = false,
    this.joinedPlayers = 0,
    this.readyPlayers = 0,
    this.isReady = false,
    this.maxPlayers = 4,
    this.gameData,
  });

  /// Tạo copy với các field được cập nhật
  RoomState copyWith({
    String? roomCode,
    bool? isLoading,
    String? errorMessage,
    List<Map<String, dynamic>>? players,
    int? playerCount,
    bool? isConnected,
    int? joinedPlayers,
    int? readyPlayers,
    bool? isReady,
    int? maxPlayers,
    Map<String, dynamic>? gameData,
  }) {
    return RoomState(
      roomCode: roomCode ?? this.roomCode,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage ?? this.errorMessage,
      players: players ?? this.players,
      playerCount: playerCount ?? this.playerCount,
      isConnected: isConnected ?? this.isConnected,
      joinedPlayers: joinedPlayers ?? this.joinedPlayers,
      readyPlayers: readyPlayers ?? this.readyPlayers,
      isReady: isReady ?? this.isReady,
      maxPlayers: maxPlayers ?? this.maxPlayers,
      gameData: gameData ?? this.gameData,
    );
  }

  /// Reset state về trạng thái ban đầu
  RoomState reset() {
    return const RoomState();
  }
}

