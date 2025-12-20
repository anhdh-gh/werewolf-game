import 'package:json_annotation/json_annotation.dart';
import 'role_config.dart';

part 'create_room_request.g.dart';

@JsonSerializable()
class CreateRoomRequest {
  final RoleConfig? roleConfig;

  CreateRoomRequest({
    this.roleConfig,
  });

  factory CreateRoomRequest.fromJson(Map<String, dynamic> json) =>
      _$CreateRoomRequestFromJson(json);

  Map<String, dynamic> toJson() => _$CreateRoomRequestToJson(this);
}

