// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'vote_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

VoteModel _$VoteModelFromJson(Map<String, dynamic> json) => VoteModel(
  voterId: (json['voter_id'] as num).toInt(),
  targetUserId: (json['target_user_id'] as num?)?.toInt(),
  timestamp:
      json['timestamp'] == null
          ? null
          : DateTime.parse(json['timestamp'] as String),
);

Map<String, dynamic> _$VoteModelToJson(VoteModel instance) => <String, dynamic>{
  'voter_id': instance.voterId,
  'target_user_id': instance.targetUserId,
  'timestamp': instance.timestamp.toIso8601String(),
};
