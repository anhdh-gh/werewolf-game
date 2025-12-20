// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'player_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

PlayerModel _$PlayerModelFromJson(Map<String, dynamic> json) => PlayerModel(
  id: (json['id'] as num).toInt(),
  username: json['username'] as String,
  email: json['email'] as String?,
  role: $enumDecodeNullable(_$PlayerRoleEnumMap, json['role']),
  status: $enumDecode(_$PlayerStatusEnumMap, json['status']),
  isMuted: json['isMuted'] as bool? ?? false,
  votedCounting: (json['votedCounting'] as num?)?.toInt() ?? 0,
  isOwner: json['isOwner'] as bool? ?? false,
);

Map<String, dynamic> _$PlayerModelToJson(PlayerModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'username': instance.username,
      'email': instance.email,
      'role': _$PlayerRoleEnumMap[instance.role],
      'status': _$PlayerStatusEnumMap[instance.status]!,
      'isMuted': instance.isMuted,
      'votedCounting': instance.votedCounting,
      'isOwner': instance.isOwner,
    };

const _$PlayerRoleEnumMap = {
  PlayerRole.wolf: 'WOLF',
  PlayerRole.guardian: 'GUARDIAN',
  PlayerRole.witch: 'WITCH',
  PlayerRole.prophet: 'PROPHET',
  PlayerRole.villager: 'VILLAGER',
  PlayerRole.cursed: 'CURSED',
  PlayerRole.mute: 'MUTE',
  PlayerRole.desperate: 'DESPERATE',
};

const _$PlayerStatusEnumMap = {
  PlayerStatus.notDead: 'NOT_DEAD',
  PlayerStatus.dead: 'DEAD',
};
