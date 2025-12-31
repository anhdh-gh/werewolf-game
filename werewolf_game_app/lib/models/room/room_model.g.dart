// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'room_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

RoomModel _$RoomModelFromJson(Map<String, dynamic> json) => RoomModel(
  roomCode: json['room_code'] as String,
  previousSecur: (json['previous_secur'] as num?)?.toInt(),
  witchHealPotion: (json['witch_heal_potion'] as num?)?.toInt() ?? 1,
  witchKillPotion: (json['witch_kill_potion'] as num?)?.toInt() ?? 1,
  gameStatus: $enumDecode(_$GameStatusEnumMap, json['game_status']),
  currentNight: (json['current_night'] as num?)?.toInt() ?? 0,
  ownerId: (json['owner_id'] as num).toInt(),
  createdAt:
      json['created_at'] == null
          ? null
          : DateTime.parse(json['created_at'] as String),
);

Map<String, dynamic> _$RoomModelToJson(RoomModel instance) => <String, dynamic>{
  'room_code': instance.roomCode,
  'previous_secur': instance.previousSecur,
  'witch_heal_potion': instance.witchHealPotion,
  'witch_kill_potion': instance.witchKillPotion,
  'game_status': _$GameStatusEnumMap[instance.gameStatus]!,
  'current_night': instance.currentNight,
  'owner_id': instance.ownerId,
  'created_at': instance.createdAt?.toIso8601String(),
};

const _$GameStatusEnumMap = {
  GameStatus.waiting: 'WAITING',
  GameStatus.nightPhase: 'NIGHT_PHASE',
  GameStatus.dayPhase: 'DAY_PHASE',
  GameStatus.ended: 'ENDED',
};
