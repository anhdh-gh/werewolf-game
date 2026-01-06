// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'create_room_request.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

CreateRoomRequest _$CreateRoomRequestFromJson(Map<String, dynamic> json) =>
    CreateRoomRequest(
      room: RoomCreateData.fromJson(json['room'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$CreateRoomRequestToJson(CreateRoomRequest instance) =>
    <String, dynamic>{'room': instance.room};

RoomCreateData _$RoomCreateDataFromJson(Map<String, dynamic> json) =>
    RoomCreateData(
      maxPlayers: (json['max_players'] as num).toInt(),
    );

Map<String, dynamic> _$RoomCreateDataToJson(RoomCreateData instance) =>
    <String, dynamic>{'max_players': instance.maxPlayers};

