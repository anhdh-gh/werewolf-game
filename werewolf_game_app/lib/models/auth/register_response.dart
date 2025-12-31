import 'package:json_annotation/json_annotation.dart';
import 'user_model.dart';

part 'register_response.g.dart';

@JsonSerializable()
class RegisterResponse {
  final UserModel data;

  RegisterResponse({
    required this.data,
  });

  factory RegisterResponse.fromJson(Map<String, dynamic> json) {
    // Handle backend response structure: {meta: {...}, data: {...}}
    if (json['data'] != null) {
      return RegisterResponse(
        data: UserModel.fromJson(json['data'] as Map<String, dynamic>),
      );
    }
    // Fallback: if data is at root level
    return RegisterResponse(
      data: UserModel.fromJson(json),
    );
  }

  Map<String, dynamic> toJson() => _$RegisterResponseToJson(this);
}

