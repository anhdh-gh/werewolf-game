// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'websocket_message.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

WebSocketMessage _$WebSocketMessageFromJson(Map<String, dynamic> json) =>
    WebSocketMessage(
      type: $enumDecode(_$MessageTypeEnumMap, json['type']),
      roomCode: json['room_code'] as String?,
      data: json['data'] as Map<String, dynamic>?,
      message: json['message'] as String?,
      timestamp:
          json['timestamp'] == null
              ? null
              : DateTime.parse(json['timestamp'] as String),
    );

Map<String, dynamic> _$WebSocketMessageToJson(WebSocketMessage instance) =>
    <String, dynamic>{
      'type': _$MessageTypeEnumMap[instance.type]!,
      'room_code': instance.roomCode,
      'data': instance.data,
      'message': instance.message,
      'timestamp': instance.timestamp?.toIso8601String(),
    };

const _$MessageTypeEnumMap = {
  MessageType.nightStart: 'NIGHT_START',
  MessageType.roleWakeUp: 'ROLE_WAKE_UP',
  MessageType.roleAction: 'ROLE_ACTION',
  MessageType.dayStart: 'DAY_START',
  MessageType.vote: 'VOTE',
  MessageType.gameEnd: 'GAME_END',
  MessageType.playerJoined: 'PLAYER_JOINED',
  MessageType.playerLeft: 'PLAYER_LEFT',
  MessageType.gameStateUpdate: 'GAME_STATE_UPDATE',
  MessageType.error: 'ERROR',
};
