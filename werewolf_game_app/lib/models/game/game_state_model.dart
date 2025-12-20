import 'package:json_annotation/json_annotation.dart';
import 'package:werewolf_game_app/models/room/room_model.dart';
import 'package:werewolf_game_app/models/game/player_model.dart';
import 'package:werewolf_game_app/models/game/vote_model.dart';

part 'game_state_model.g.dart';

enum GamePhase {
  @JsonValue('WAITING')
  waiting,
  @JsonValue('NIGHT')
  night,
  @JsonValue('DAY')
  day,
  @JsonValue('ENDED')
  ended,
}

enum WinnerType {
  @JsonValue('WOLVES')
  wolves,
  @JsonValue('VILLAGERS')
  villagers,
  @JsonValue('DESPERATE')
  desperate,
  @JsonValue('NONE')
  none,
}

@JsonSerializable()
class GameStateModel {
  @JsonKey(name: 'room_code')
  final String roomCode;
  
  final GamePhase currentPhase;
  
  @JsonKey(name: 'current_night')
  final int currentNight;
  
  final List<PlayerModel> players;
  
  @JsonKey(name: 'alive_players')
  final List<PlayerModel> alivePlayers;
  
  @JsonKey(name: 'dead_players')
  final List<PlayerModel> deadPlayers;
  
  @JsonKey(name: 'current_active_role')
  final String? currentActiveRole; // For night phase
  
  final List<VoteModel> votes;
  
  @JsonKey(name: 'vote_results')
  final Map<int, int>? voteResults; // userId -> vote count
  
  @JsonKey(name: 'night_results')
  final Map<String, dynamic>? nightResults;
  
  @JsonKey(name: 'winner_type')
  final WinnerType? winnerType;
  
  @JsonKey(name: 'muted_player_id')
  final int? mutedPlayerId;

  GameStateModel({
    required this.roomCode,
    required this.currentPhase,
    this.currentNight = 0,
    required this.players,
    required this.alivePlayers,
    required this.deadPlayers,
    this.currentActiveRole,
    this.votes = const [],
    this.voteResults,
    this.nightResults,
    this.winnerType,
    this.mutedPlayerId,
  });

  factory GameStateModel.fromJson(Map<String, dynamic> json) =>
      _$GameStateModelFromJson(json);

  Map<String, dynamic> toJson() => _$GameStateModelToJson(this);

  // Helper methods
  List<PlayerModel> getPlayersByRole(String role) {
    return alivePlayers.where((p) => p.role?.toString() == role).toList();
  }

  int getVoteCount(int userId) {
    return voteResults?[userId] ?? 0;
  }

  List<int> getPlayersWithMostVotes() {
    if (voteResults == null || voteResults!.isEmpty) return [];
    
    final maxVotes = voteResults!.values.reduce((a, b) => a > b ? a : b);
    if (maxVotes < 2) return []; // Need at least 2 votes
    
    return voteResults!.entries
        .where((e) => e.value == maxVotes)
        .map((e) => e.key)
        .toList();
  }
}

