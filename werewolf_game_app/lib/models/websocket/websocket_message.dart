import 'package:json_annotation/json_annotation.dart';

part 'websocket_message.g.dart';

enum MessageType {
  @JsonValue('NIGHT_START')
  nightStart,
  @JsonValue('ROLE_WAKE_UP')
  roleWakeUp,
  @JsonValue('ROLE_ACTION')
  roleAction,
  @JsonValue('DAY_START')
  dayStart,
  @JsonValue('VOTE')
  vote,
  @JsonValue('GAME_END')
  gameEnd,
  @JsonValue('PLAYER_JOINED')
  playerJoined,
  @JsonValue('PLAYER_LEFT')
  playerLeft,
  @JsonValue('GAME_STATE_UPDATE')
  gameStateUpdate,
  @JsonValue('ERROR')
  error,
}

@JsonSerializable()
class WebSocketMessage {
  final MessageType type;
  
  @JsonKey(name: 'room_code')
  final String? roomCode;
  
  final Map<String, dynamic>? data;
  
  final String? message;
  
  final DateTime? timestamp;

  WebSocketMessage({
    required this.type,
    this.roomCode,
    this.data,
    this.message,
    this.timestamp,
  });

  factory WebSocketMessage.fromJson(Map<String, dynamic> json) =>
      _$WebSocketMessageFromJson(json);

  Map<String, dynamic> toJson() => _$WebSocketMessageToJson(this);
}

