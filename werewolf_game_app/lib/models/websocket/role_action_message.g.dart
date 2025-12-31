// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'role_action_message.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

RoleActionMessage _$RoleActionMessageFromJson(Map<String, dynamic> json) =>
    RoleActionMessage(
      roomCode: json['room_code'] as String,
      role: $enumDecode(_$PlayerRoleEnumMap, json['role']),
      actionType: json['action_type'] as String,
      targetUserId: (json['target_user_id'] as num?)?.toInt(),
      additionalData: json['additionalData'] as Map<String, dynamic>?,
    );

Map<String, dynamic> _$RoleActionMessageToJson(RoleActionMessage instance) =>
    <String, dynamic>{
      'room_code': instance.roomCode,
      'role': _$PlayerRoleEnumMap[instance.role]!,
      'action_type': instance.actionType,
      'target_user_id': instance.targetUserId,
      'additionalData': instance.additionalData,
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
