import 'package:json_annotation/json_annotation.dart';
import 'package:werewolf_game_app/models/room/user_room_model.dart';

part 'game_event.g.dart';

@JsonSerializable()
class GameEvent {
  @JsonKey(name: 'event_type')
  final String eventType;
  
  @JsonKey(name: 'room_code')
  final String roomCode;
  
  final Map<String, dynamic>? payload;

  GameEvent({
    required this.eventType,
    required this.roomCode,
    this.payload,
  });

  factory GameEvent.fromJson(Map<String, dynamic> json) =>
      _$GameEventFromJson(json);

  Map<String, dynamic> toJson() => _$GameEventToJson(this);
}

