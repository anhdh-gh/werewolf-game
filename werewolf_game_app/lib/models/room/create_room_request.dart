import 'package:json_annotation/json_annotation.dart';

part 'create_room_request.g.dart';

@JsonSerializable()
class CreateRoomRequest {
  final RoomCreateData room;

  CreateRoomRequest({required this.room});

  factory CreateRoomRequest.fromJson(Map<String, dynamic> json) => 
      _$CreateRoomRequestFromJson(json);

  Map<String, dynamic> toJson() => _$CreateRoomRequestToJson(this);
}

@JsonSerializable()
class RoomCreateData {
  @JsonKey(name: 'max_players')
  final int maxPlayers;

  RoomCreateData({required this.maxPlayers});

  factory RoomCreateData.fromJson(Map<String, dynamic> json) => 
      _$RoomCreateDataFromJson(json);

  Map<String, dynamic> toJson() => _$RoomCreateDataToJson(this);
}

