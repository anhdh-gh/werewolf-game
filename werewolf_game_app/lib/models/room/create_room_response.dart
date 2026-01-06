// werewolf_game_app/lib/models/room/create_room_response.dart
import 'package:json_annotation/json_annotation.dart';

part 'create_room_response.g.dart';

@JsonSerializable()
class CreateRoomResponse {
  final Meta meta;
  final RoomData data;

  CreateRoomResponse({
    required this.meta,
    required this.data,
  });

  factory CreateRoomResponse.fromJson(Map<String, dynamic> json) {
    // Handle backend response structure: {meta: {...}, data: {...}}
    return CreateRoomResponse(
      meta: Meta.fromJson(json['meta'] as Map<String, dynamic>),
      data: RoomData.fromJson(json['data'] as Map<String, dynamic>),
    );
  }

  Map<String, dynamic> toJson() => _$CreateRoomResponseToJson(this);
}

@JsonSerializable()
class Meta {
  final int code;
  final String message;

  Meta({required this.code, required this.message});

  factory Meta.fromJson(Map<String, dynamic> json) => _$MetaFromJson(json);
  Map<String, dynamic> toJson() => _$MetaToJson(this);
}

@JsonSerializable()
class RoomData {
  final Room room;
  @JsonKey(name: 'next_step')
  final NextStep nextStep;

  RoomData({required this.room, required this.nextStep});

  factory RoomData.fromJson(Map<String, dynamic> json) => _$RoomDataFromJson(json);
  Map<String, dynamic> toJson() => _$RoomDataToJson(this);
}

@JsonSerializable()
class Room {
  final String code;

  Room({required this.code});

  factory Room.fromJson(Map<String, dynamic> json) => _$RoomFromJson(json);
  Map<String, dynamic> toJson() => _$RoomToJson(this);
}

@JsonSerializable()
class NextStep {
  final String action;
  final String description;
  final String websocket;

  NextStep({
    required this.action,
    required this.description,
    required this.websocket,
  });

  factory NextStep.fromJson(Map<String, dynamic> json) => _$NextStepFromJson(json);
  Map<String, dynamic> toJson() => _$NextStepToJson(this);
}