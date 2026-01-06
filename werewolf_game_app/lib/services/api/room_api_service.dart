
import 'dart:developer' as developer;
import 'package:dio/dio.dart';
import 'package:werewolf_game_app/config/env.dart';
import 'package:werewolf_game_app/models/room/create_room_response.dart';
import 'package:werewolf_game_app/models/room/create_room_request.dart';
import 'package:werewolf_game_app/models/room/join_room_request.dart';
import 'package:werewolf_game_app/services/api/api_client.dart';

class RoomApiService {
  final Dio _dio = apiClient.dio;

  Future<CreateRoomResponse> createRoom({int maxPlayers = 4}) async {
    developer.log('🌐 [RoomApiService] createRoom called - maxPlayers: $maxPlayers');
    developer.log('🌐 [RoomApiService] Endpoint: ${Env.createRoomEndpoint}');
    
    try {
      // Tạo request body với max_players
      final request = CreateRoomRequest(
        room: RoomCreateData(maxPlayers: maxPlayers),
      );
      developer.log('🌐 [RoomApiService] Request body: ${request.toJson()}');

      developer.log('🌐 [RoomApiService] Sending POST request...');
      final response = await _dio.post(
        Env.createRoomEndpoint, // '/api/v1/rooms/create'
        data: request.toJson(), // Gửi body với max_players
      );
      
      developer.log('🌐 [RoomApiService] Response status: ${response.statusCode}');
      developer.log('🌐 [RoomApiService] Response data: ${response.data}');

      // Handle backend response structure: {meta: {...}, data: {...}}
      final responseData = response.data is Map<String, dynamic>
          ? response.data as Map<String, dynamic>
          : {'data': response.data};

      developer.log('🌐 [RoomApiService] Parsing response...');
      final parsedResponse = CreateRoomResponse.fromJson(responseData);
      developer.log('🌐 [RoomApiService] Response parsed successfully - roomCode: ${parsedResponse.data.room.code}');
      
      return parsedResponse;
    } on DioException catch (e) {
      developer.log('❌ [RoomApiService] DioException: ${e.message}');
      developer.log('❌ [RoomApiService] Response: ${e.response?.data}');
      developer.log('❌ [RoomApiService] Status code: ${e.response?.statusCode}');
      developer.log('❌ [RoomApiService] Error type: ${e.type}');
      throw _handleError(e);
    } catch (e) {
      developer.log('❌ [RoomApiService] Unexpected error: $e');
      rethrow;
    }
  }

    Future<CreateRoomResponse> joinRoom(String roomCode) async {
    try {
      // Tạo request body theo format backend yêu cầu
      final request = JoinRoomRequest(
        room: RoomRequest(code: roomCode),
      );

      // Gọi API POST để join phòng
      final response = await _dio.post(
        Env.joinRoomEndpoint, // '/api/v1/rooms/join'
        data: request.toJson(),
      );

      // Handle backend response structure: {meta: {...}, data: {...}}
      final responseData = response.data is Map<String, dynamic>
          ? response.data as Map<String, dynamic>
          : {'data': response.data};

      return CreateRoomResponse.fromJson(responseData);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Exception _handleError(DioException error) {
    if (error.response != null) {
      final statusCode = error.response?.statusCode;
      final data = error.response?.data;

      String message;

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
        return 'Unauthorized. Please login again.';
      case 403:
        return 'Access denied.';
      case 404:
        return 'Resource not found.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return 'An error occurred. Please try again.';
    }
  }
}