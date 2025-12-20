import 'package:json_annotation/json_annotation.dart';

part 'vote_message.g.dart';

@JsonSerializable()
class VoteMessage {
  @JsonKey(name: 'room_code')
  final String roomCode;
  
  @JsonKey(name: 'voter_id')
  final int voterId;
  
  @JsonKey(name: 'target_user_id')
  final int? targetUserId; // null means skip vote
  
  final DateTime timestamp;

  VoteMessage({
    required this.roomCode,
    required this.voterId,
    this.targetUserId,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();

  factory VoteMessage.fromJson(Map<String, dynamic> json) =>
      _$VoteMessageFromJson(json);

  Map<String, dynamic> toJson() => _$VoteMessageToJson(this);
}

