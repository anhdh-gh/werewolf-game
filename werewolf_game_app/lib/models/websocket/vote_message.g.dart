// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'vote_message.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

VoteMessage _$VoteMessageFromJson(Map<String, dynamic> json) => VoteMessage(
  roomCode: json['room_code'] as String,
  voterId: (json['voter_id'] as num).toInt(),
  targetUserId: (json['target_user_id'] as num?)?.toInt(),
  timestamp:
      json['timestamp'] == null
          ? null
          : DateTime.parse(json['timestamp'] as String),
);

Map<String, dynamic> _$VoteMessageToJson(VoteMessage instance) =>
    <String, dynamic>{
      'room_code': instance.roomCode,
      'voter_id': instance.voterId,
      'target_user_id': instance.targetUserId,
      'timestamp': instance.timestamp.toIso8601String(),
    };
