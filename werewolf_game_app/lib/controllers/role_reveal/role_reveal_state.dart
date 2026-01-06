/// State model cho Role Reveal
class RoleRevealState {
  final String? revealedRole;
  final bool isRevealed;
  final int timeRemaining;
  final bool hasNavigatedAway;

  const RoleRevealState({
    this.revealedRole,
    this.isRevealed = false,
    this.timeRemaining = 10,
    this.hasNavigatedAway = false,
  });

  RoleRevealState copyWith({
    String? revealedRole,
    bool? isRevealed,
    int? timeRemaining,
    bool? hasNavigatedAway,
  }) {
    return RoleRevealState(
      revealedRole: revealedRole ?? this.revealedRole,
      isRevealed: isRevealed ?? this.isRevealed,
      timeRemaining: timeRemaining ?? this.timeRemaining,
      hasNavigatedAway: hasNavigatedAway ?? this.hasNavigatedAway,
    );
  }
}

