// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'game_state_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

GameStateModel _$GameStateModelFromJson(Map<String, dynamic> json) =>
    GameStateModel(
      roomCode: json['room_code'] as String,
      currentPhase: $enumDecode(_$GamePhaseEnumMap, json['currentPhase']),
      currentNight: (json['current_night'] as num?)?.toInt() ?? 0,
      players:
          (json['players'] as List<dynamic>)
              .map((e) => PlayerModel.fromJson(e as Map<String, dynamic>))
              .toList(),
      alivePlayers:
          (json['alive_players'] as List<dynamic>)
              .map((e) => PlayerModel.fromJson(e as Map<String, dynamic>))
              .toList(),
      deadPlayers:
          (json['dead_players'] as List<dynamic>)
              .map((e) => PlayerModel.fromJson(e as Map<String, dynamic>))
              .toList(),
      currentActiveRole: json['current_active_role'] as String?,
      votes:
          (json['votes'] as List<dynamic>?)
              ?.map((e) => VoteModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      voteResults: (json['vote_results'] as Map<String, dynamic>?)?.map(
        (k, e) => MapEntry(int.parse(k), (e as num).toInt()),
      ),
      nightResults: json['night_results'] as Map<String, dynamic>?,
      winnerType: $enumDecodeNullable(_$WinnerTypeEnumMap, json['winner_type']),
      mutedPlayerId: (json['muted_player_id'] as num?)?.toInt(),
    );

Map<String, dynamic> _$GameStateModelToJson(GameStateModel instance) =>
    <String, dynamic>{
      'room_code': instance.roomCode,
      'currentPhase': _$GamePhaseEnumMap[instance.currentPhase]!,
      'current_night': instance.currentNight,
      'players': instance.players,
      'alive_players': instance.alivePlayers,
      'dead_players': instance.deadPlayers,
      'current_active_role': instance.currentActiveRole,
      'votes': instance.votes,
      'vote_results': instance.voteResults?.map(
        (k, e) => MapEntry(k.toString(), e),
      ),
      'night_results': instance.nightResults,
      'winner_type': _$WinnerTypeEnumMap[instance.winnerType],
      'muted_player_id': instance.mutedPlayerId,
    };

const _$GamePhaseEnumMap = {
  GamePhase.waiting: 'WAITING',
  GamePhase.night: 'NIGHT',
  GamePhase.day: 'DAY',
  GamePhase.ended: 'ENDED',
};

const _$WinnerTypeEnumMap = {
  WinnerType.wolves: 'WOLVES',
  WinnerType.villagers: 'VILLAGERS',
  WinnerType.desperate: 'DESPERATE',
  WinnerType.none: 'NONE',
};
