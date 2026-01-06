import 'package:json_annotation/json_annotation.dart';

part 'join_room_request.g.dart';

@JsonSerializable()
class JoinRoomRequest {
  final RoomRequest room;

  JoinRoomRequest({required this.room});

  factory JoinRoomRequest.fromJson(Map<String, dynamic> json) => 
      _$JoinRoomRequestFromJson(json);

  Map<String, dynamic> toJson() => _$JoinRoomRequestToJson(this);
}

@JsonSerializable()
class RoomRequest {
  final String code;

  RoomRequest({required this.code});

  factory RoomRequest.fromJson(Map<String, dynamic> json) => 
      _$RoomRequestFromJson(json);

  Map<String, dynamic> toJson() => _$RoomRequestToJson(this);
}