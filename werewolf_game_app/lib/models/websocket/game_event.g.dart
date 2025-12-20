// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'game_event.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

GameEvent _$GameEventFromJson(Map<String, dynamic> json) => GameEvent(
  eventType: json['event_type'] as String,
  roomCode: json['room_code'] as String,
  payload: json['payload'] as Map<String, dynamic>?,
);

Map<String, dynamic> _$GameEventToJson(GameEvent instance) => <String, dynamic>{
  'event_type': instance.eventType,
  'room_code': instance.roomCode,
  'payload': instance.payload,
};
