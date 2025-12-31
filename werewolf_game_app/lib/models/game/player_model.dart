import 'package:json_annotation/json_annotation.dart';
import 'package:werewolf_game_app/models/room/user_room_model.dart';

part 'player_model.g.dart';

@JsonSerializable()
class PlayerModel {
  final int id;
  final String username;
  final String? email;
  final PlayerRole? role;
  final PlayerStatus status;
  final bool isMuted;
  final int votedCounting;
  final bool isOwner;

  PlayerModel({
    required this.id,
    required this.username,
    this.email,
    this.role,
    required this.status,
    this.isMuted = false,
    this.votedCounting = 0,
    this.isOwner = false,
  });

  factory PlayerModel.fromUserRoom(UserRoomModel userRoom, {String? username, String? email}) {
    return PlayerModel(
      id: userRoom.userId,
      username: username ?? userRoom.username ?? 'Unknown',
      email: email ?? userRoom.email,
      role: userRoom.role,
      status: userRoom.status,
      isMuted: userRoom.isMuted,
      votedCounting: userRoom.votedCounting,
      isOwner: userRoom.isOwner,
    );
  }

  factory PlayerModel.fromJson(Map<String, dynamic> json) =>
      _$PlayerModelFromJson(json);

  Map<String, dynamic> toJson() => _$PlayerModelToJson(this);

  bool get isAlive => status == PlayerStatus.notDead;
}

