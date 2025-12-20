// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'start_game_request.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

StartGameRequest _$StartGameRequestFromJson(Map<String, dynamic> json) =>
    StartGameRequest(
      roleConfig: RoleConfig.fromJson(
        json['roleConfig'] as Map<String, dynamic>,
      ),
    );

Map<String, dynamic> _$StartGameRequestToJson(StartGameRequest instance) =>
    <String, dynamic>{'roleConfig': instance.roleConfig};
