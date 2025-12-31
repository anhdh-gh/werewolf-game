import 'package:dio/dio.dart';
import 'package:werewolf_game_app/config/env.dart';
import 'package:werewolf_game_app/models/auth/auth_response.dart';
import 'package:werewolf_game_app/models/auth/register_response.dart';
import 'package:werewolf_game_app/models/auth/user_model.dart';
import 'package:werewolf_game_app/models/auth/login_request.dart';
import 'package:werewolf_game_app/models/auth/register_request.dart';
import 'package:werewolf_game_app/models/auth/refresh_token_request.dart';
import 'package:werewolf_game_app/services/api/api_client.dart';

class AuthApiService {
  final Dio _dio = apiClient.dio;

  // Register new user (doesn't return tokens, only user info)
  Future<RegisterResponse> register({
    required String email,
    required String username,
    required String password,
  }) async {
    try {
      final request = RegisterRequest(
        email: email,
        username: username,
        password: password,
      );

      final response = await _dio.post(
        Env.registerEndpoint,
        data: request.toJson(),
      );

      // Handle backend response structure: {meta: {...}, data: {...}}
      final responseData =
          response.data is Map<String, dynamic>
              ? response.data as Map<String, dynamic>
              : {'data': response.data};

      return RegisterResponse.fromJson(responseData);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Login user
  Future<AuthResponse> login({
    required String username,
    required String password,
  }) async {
    try {
      final request = LoginRequest(username: username, password: password);

      final response = await _dio.post(
        Env.loginEndpoint,
        data: request.toJson(),
      );

      // Handle backend response structure: {meta: {...}, data: {...}}
      final responseData =
          response.data is Map<String, dynamic>
              ? response.data as Map<String, dynamic>
              : {'data': response.data};

      return AuthResponse.fromJson(responseData);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Refresh access token
  Future<AuthResponse> refreshToken(String refreshToken) async {
    try {
      final request = RefreshTokenRequest(refreshToken: refreshToken);

      final response = await _dio.post(
        Env.refreshTokenEndpoint,
        data: request.toJson(),
      );

      // Handle backend response structure: {meta: {...}, data: {...}}
      final responseData =
          response.data is Map<String, dynamic>
              ? response.data as Map<String, dynamic>
              : {'data': response.data};

      return AuthResponse.fromJson(responseData);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Get current user information (POST /api/v1/users/info)
  Future<UserModel> getCurrentUser() async {
    try {
      final response = await _dio.post(Env.getUserInfoEndpoint);

      // Handle backend response structure: {meta: {...}, data: {...}}
      final responseData = response.data is Map<String, dynamic>
          ? response.data as Map<String, dynamic>
          : {'data': response.data};

      // Extract user from data
      final data = responseData['data'] ?? responseData;
      
      return UserModel.fromJson(data is Map<String, dynamic> ? data : {});
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> deleteAccount() async {
    try {
      await _dio.post(Env.deleteAccountEndpoint);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Handle API errors
  Exception _handleError(DioException error) {
    if (error.response != null) {
      // Server responded with error status code
      final statusCode = error.response?.statusCode;
      final data = error.response?.data;

      String message;

      // Handle backend response structure: {meta: {code, message}, data: {...}}
      if (data is Map<String, dynamic>) {
        if (data.containsKey('meta') && data['meta'] is Map<String, dynamic>) {
          final meta = data['meta'] as Map<String, dynamic>;
          if (meta.containsKey('message')) {
            message = meta['message'] as String;
          } else if (data.containsKey('message')) {
            message = data['message'] as String;
          } else {
            message = _getDefaultErrorMessage(statusCode);
          }
        } else if (data.containsKey('message')) {
          message = data['message'] as String;
        } else {
          message = _getDefaultErrorMessage(statusCode);
        }
      } else {
        message = _getDefaultErrorMessage(statusCode);
      }

      return Exception(message);
    } else if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout) {
      return Exception(
        'Connection timeout. Please check your internet connection.',
      );
    } else if (error.type == DioExceptionType.connectionError) {
      return Exception('No internet connection. Please check your network.');
    } else {
      return Exception('An unexpected error occurred. Please try again.');
    }
  }

  String _getDefaultErrorMessage(int? statusCode) {
    switch (statusCode) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Invalid credentials. Please try again.';
      case 403:
        return 'Access denied.';
      case 404:
        return 'Resource not found.';
      case 409:
        return 'User already exists.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return 'An error occurred. Please try again.';
    }
  }
}
