// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_room_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

UserRoomModel _$UserRoomModelFromJson(Map<String, dynamic> json) =>
    UserRoomModel(
      id: (json['id'] as num).toInt(),
      roomCode: json['room_code'] as String,
      userId: (json['user_id'] as num).toInt(),
      isOwner: json['is_owner'] as bool,
      role: $enumDecodeNullable(_$PlayerRoleEnumMap, json['role']),
      status:
          $enumDecodeNullable(_$PlayerStatusEnumMap, json['status']) ??
          PlayerStatus.notDead,
      votedCounting: (json['voted_counting'] as num?)?.toInt() ?? 0,
      isMuted: json['is_muted'] as bool? ?? false,
      username: json['username'] as String?,
      email: json['email'] as String?,
    );

Map<String, dynamic> _$UserRoomModelToJson(UserRoomModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'room_code': instance.roomCode,
      'user_id': instance.userId,
      'is_owner': instance.isOwner,
      'role': _$PlayerRoleEnumMap[instance.role],
      'status': _$PlayerStatusEnumMap[instance.status]!,
      'voted_counting': instance.votedCounting,
      'is_muted': instance.isMuted,
      'username': instance.username,
      'email': instance.email,
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
