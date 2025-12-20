import 'package:json_annotation/json_annotation.dart';
import 'user_model.dart';

part 'auth_response.g.dart';

@JsonSerializable()
class AuthResponse {
  @JsonKey(name: 'access_token')
  final String accessToken;
  @JsonKey(name: 'refresh_token')
  final String refreshToken;
  final UserModel? user;

  AuthResponse({
    required this.accessToken,
    required this.refreshToken,
    this.user,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    // Handle backend response structure: {meta: {...}, data: {...}}
    Map<String, dynamic> data;
    
    if (json.containsKey('data') && json['data'] is Map<String, dynamic>) {
      data = json['data'] as Map<String, dynamic>;
    } else {
      data = json;
    }
    
    final normalizedJson = <String, dynamic>{};
    
    // Extract tokens from data
    normalizedJson['access_token'] = data['access_token'] ?? data['accessToken'] ?? '';
    normalizedJson['refresh_token'] = data['refresh_token'] ?? data['refreshToken'] ?? '';
    
    // Extract user object (if present in data)
    if (data['user'] != null) {
      normalizedJson['user'] = data['user'];
    } else if (data['id'] != null || data['username'] != null || data['email'] != null) {
      // User data might be at root level of data
      normalizedJson['user'] = data;
    } else {
      // Login response might not have user info, set to null
      normalizedJson['user'] = null;
    }
    
    return _$AuthResponseFromJson(normalizedJson);
  }

  Map<String, dynamic> toJson() => _$AuthResponseToJson(this);
}

