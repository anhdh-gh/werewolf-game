import 'package:json_annotation/json_annotation.dart';

part 'join_room_request.g.dart';

@JsonSerializable()
class JoinRoomRequest {
  @JsonKey(name: 'room_code')
  final String roomCode;

  JoinRoomRequest({
    required this.roomCode,
  });

  factory JoinRoomRequest.fromJson(Map<String, dynamic> json) =>
      _$JoinRoomRequestFromJson(json);

  Map<String, dynamic> toJson() => _$JoinRoomRequestToJson(this);
}

