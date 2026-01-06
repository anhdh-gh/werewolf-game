// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'join_room_request.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

JoinRoomRequest _$JoinRoomRequestFromJson(Map<String, dynamic> json) =>
    JoinRoomRequest(
      room: RoomRequest.fromJson(json['room'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$JoinRoomRequestToJson(JoinRoomRequest instance) =>
    <String, dynamic>{'room': instance.room};

RoomRequest _$RoomRequestFromJson(Map<String, dynamic> json) =>
    RoomRequest(code: json['code'] as String);

Map<String, dynamic> _$RoomRequestToJson(RoomRequest instance) =>
    <String, dynamic>{'code': instance.code};
