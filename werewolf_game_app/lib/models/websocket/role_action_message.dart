import 'package:json_annotation/json_annotation.dart';
import 'package:werewolf_game_app/models/room/user_room_model.dart';

part 'role_action_message.g.dart';

@JsonSerializable()
class RoleActionMessage {
  @JsonKey(name: 'room_code')
  final String roomCode;
  
  final PlayerRole role;
  
  @JsonKey(name: 'action_type')
  final String actionType; // PROTECT, KILL, CHECK, SAVE, KILL_POTION, REVEAL, MUTE
  
  @JsonKey(name: 'target_user_id')
  final int? targetUserId;
  
  final Map<String, dynamic>? additionalData;

  RoleActionMessage({
    required this.roomCode,
    required this.role,
    required this.actionType,
    this.targetUserId,
    this.additionalData,
  });

  factory RoleActionMessage.fromJson(Map<String, dynamic> json) =>
      _$RoleActionMessageFromJson(json);

  Map<String, dynamic> toJson() => _$RoleActionMessageToJson(this);
}

