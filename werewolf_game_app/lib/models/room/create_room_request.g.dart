// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'create_room_request.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

CreateRoomRequest _$CreateRoomRequestFromJson(Map<String, dynamic> json) =>
    CreateRoomRequest(
      roleConfig:
          json['roleConfig'] == null
              ? null
              : RoleConfig.fromJson(json['roleConfig'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$CreateRoomRequestToJson(CreateRoomRequest instance) =>
    <String, dynamic>{'roleConfig': instance.roleConfig};
