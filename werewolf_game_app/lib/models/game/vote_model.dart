import 'package:json_annotation/json_annotation.dart';

part 'vote_model.g.dart';

@JsonSerializable()
class VoteModel {
  @JsonKey(name: 'voter_id')
  final int voterId;
  
  @JsonKey(name: 'target_user_id')
  final int? targetUserId; // null means skip vote
  
  final DateTime timestamp;

  VoteModel({
    required this.voterId,
    this.targetUserId,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();

  factory VoteModel.fromJson(Map<String, dynamic> json) =>
      _$VoteModelFromJson(json);

  Map<String, dynamic> toJson() => _$VoteModelToJson(this);
}

