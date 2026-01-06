import 'package:json_annotation/json_annotation.dart';

part 'user_model.g.dart';

@JsonSerializable()
class UserModel {
  @JsonKey(fromJson: _idFromJson)
  final int id;
  final String username;
  final String email;

  UserModel({
    required this.id,
    required this.username,
    required this.email,
  });

  // Helper function to parse id from String or int
  static int _idFromJson(dynamic value) {
    if (value is int) return value;
    if (value is String) return int.parse(value);
    throw Exception('Invalid id type: $value');
  }

  factory UserModel.fromJson(Map<String, dynamic> json) =>
      _$UserModelFromJson(json);

  Map<String, dynamic> toJson() => _$UserModelToJson(this);

  @override
  String toString() => 'UserModel(id: $id, username: $username, email: $email)';
}