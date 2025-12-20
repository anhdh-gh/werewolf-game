import 'package:json_annotation/json_annotation.dart';

part 'user_room_model.g.dart';

enum PlayerStatus {
  @JsonValue('NOT_DEAD')
  notDead,
  @JsonValue('DEAD')
  dead,
}

enum PlayerRole {
  @JsonValue('WOLF')
  wolf,
  @JsonValue('GUARDIAN')
  guardian,
  @JsonValue('WITCH')
  witch,
  @JsonValue('PROPHET')
  prophet,
  @JsonValue('VILLAGER')
  villager,
  @JsonValue('CURSED')
  cursed,
  @JsonValue('MUTE')
  mute,
  @JsonValue('DESPERATE')
  desperate,
}

@JsonSerializable()
class UserRoomModel {
  final int id;
  
  @JsonKey(name: 'room_code')
  final String roomCode;
  
  @JsonKey(name: 'user_id')
  final int userId;
  
  @JsonKey(name: 'is_owner')
  final bool isOwner;
  
  final PlayerRole? role;
  
  final PlayerStatus status;
  
  @JsonKey(name: 'voted_counting')
  final int votedCounting;
  
  @JsonKey(name: 'is_muted')
  final bool isMuted;
  
  // User info (if included in response)
  final String? username;
  final String? email;

  UserRoomModel({
    required this.id,
    required this.roomCode,
    required this.userId,
    required this.isOwner,
    this.role,
    this.status = PlayerStatus.notDead,
    this.votedCounting = 0,
    this.isMuted = false,
    this.username,
    this.email,
  });

  factory UserRoomModel.fromJson(Map<String, dynamic> json) =>
      _$UserRoomModelFromJson(json);

  Map<String, dynamic> toJson() => _$UserRoomModelToJson(this);
}

