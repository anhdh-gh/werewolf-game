import 'package:json_annotation/json_annotation.dart';
import 'role_config.dart';

part 'start_game_request.g.dart';

@JsonSerializable()
class StartGameRequest {
  final RoleConfig roleConfig;

  StartGameRequest({
    required this.roleConfig,
  });

  factory StartGameRequest.fromJson(Map<String, dynamic> json) =>
      _$StartGameRequestFromJson(json);

  Map<String, dynamic> toJson() => _$StartGameRequestToJson(this);
}

