/// State model cho Game Flow
/// Quản lý trạng thái game, phase, và player actions
class GameState {
  final String? currentPhase; // ALL_VIEW_ROLE, NIGHT_SEER, NIGHT_WOLF, etc.
  final String? currentAction; // SLEEP, WAKEUP, VIEW, VOTE
  final String? currentRole; // Role hiện tại của player
  final String? currentEvent; // ALL, WOLF, SEER, etc.
  final String? message; // Message từ backend
  final List<Map<String, dynamic>>? players; // Danh sách players
  final bool isNight; // Đang là đêm
  final bool isDay; // Đang là ngày
  final bool canAct; // Có thể thực hiện action không
  final String? selectedPlayerId; // Player đã chọn để vote/xem
  final bool hasVoted; // Đã vote chưa
  final bool hasDoneAction; // Đã done action chưa
  final String? viewedRole; // Role đã xem (cho Tiên tri)
  final bool isDead; // Đã chết
  final bool isMuted; // Bị câm
  final Map<String, dynamic>? gameData; // Raw game data từ backend

  const GameState({
    this.currentPhase,
    this.currentAction,
    this.currentRole,
    this.currentEvent,
    this.message,
    this.players,
    this.isNight = false,
    this.isDay = false,
    this.canAct = false,
    this.selectedPlayerId,
    this.hasVoted = false,
    this.hasDoneAction = false,
    this.viewedRole,
    this.isDead = false,
    this.isMuted = false,
    this.gameData,
  });

  GameState copyWith({
    String? currentPhase,
    String? currentAction,
    String? currentRole,
    String? currentEvent,
    String? message,
    List<Map<String, dynamic>>? players,
    bool? isNight,
    bool? isDay,
    bool? canAct,
    String? selectedPlayerId,
    bool? hasVoted,
    bool? hasDoneAction,
    String? viewedRole,
    bool? isDead,
    bool? isMuted,
    Map<String, dynamic>? gameData,
  }) {
    return GameState(
      currentPhase: currentPhase ?? this.currentPhase,
      currentAction: currentAction ?? this.currentAction,
      currentRole: currentRole ?? this.currentRole,
      currentEvent: currentEvent ?? this.currentEvent,
      message: message ?? this.message,
      players: players ?? this.players,
      isNight: isNight ?? this.isNight,
      isDay: isDay ?? this.isDay,
      canAct: canAct ?? this.canAct,
      selectedPlayerId: selectedPlayerId ?? this.selectedPlayerId,
      hasVoted: hasVoted ?? this.hasVoted,
      hasDoneAction: hasDoneAction ?? this.hasDoneAction,
      viewedRole: viewedRole ?? this.viewedRole,
      isDead: isDead ?? this.isDead,
      isMuted: isMuted ?? this.isMuted,
      gameData: gameData ?? this.gameData,
    );
  }
}

