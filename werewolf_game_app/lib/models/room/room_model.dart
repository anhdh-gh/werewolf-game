import 'package:json_annotation/json_annotation.dart';

part 'room_model.g.dart';

enum GameStatus {
  @JsonValue('WAITING')
  waiting,
  @JsonValue('NIGHT_PHASE')
  nightPhase,
  @JsonValue('DAY_PHASE')
  dayPhase,
  @JsonValue('ENDED')
  ended,
}

@JsonSerializable()
class RoomModel {
  @JsonKey(name: 'room_code')
  final String roomCode;
  
  @JsonKey(name: 'previous_secur')
  final int? previousSecur;
  
  @JsonKey(name: 'witch_heal_potion')
  final int witchHealPotion;
  
  @JsonKey(name: 'witch_kill_potion')
  final int witchKillPotion;
  
  @JsonKey(name: 'game_status')
  final GameStatus? gameStatus;
  
  @JsonKey(name: 'current_night')
  final int currentNight;
  
  @JsonKey(name: 'owner_id')
  final int? ownerId;
  
  @JsonKey(name: 'created_at')
  final DateTime? createdAt;

  RoomModel({
    required this.roomCode,
    this.previousSecur,
    this.witchHealPotion = 1,
    this.witchKillPotion = 1,
    this.gameStatus,
    this.currentNight = 0,
    this.ownerId,
    this.createdAt,
  });

  factory RoomModel.fromJson(Map<String, dynamic> json) {
    // Handle case where json has 'code' instead of 'room_code'
    final roomCode = json['room_code'] ?? json['code'] ?? '';
    if (roomCode.isNotEmpty && !json.containsKey('room_code')) {
      json['room_code'] = roomCode;
    }
    return _$RoomModelFromJson(json);
  }

  Map<String, dynamic> toJson() => _$RoomModelToJson(this);
}

