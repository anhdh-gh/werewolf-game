import 'package:dio/dio.dart';
import 'package:werewolf_game_app/config/env.dart';
import 'package:werewolf_game_app/models/room/room_model.dart';
import 'package:werewolf_game_app/models/room/user_room_model.dart';
import 'package:werewolf_game_app/models/room/role_config.dart';
import 'package:werewolf_game_app/models/room/create_room_request.dart';
import 'package:werewolf_game_app/models/room/join_room_request.dart';
import 'package:werewolf_game_app/models/room/start_game_request.dart';
import 'package:werewolf_game_app/services/api/api_client.dart';

class RoomApiService {
  final Dio _dio = apiClient.dio;

  // Create a new room
  Future<RoomModel> createRoom({RoleConfig? roleConfig}) async {
    try {
      final request = CreateRoomRequest(roleConfig: roleConfig);

      final response = await _dio.post(
        Env.createRoomEndpoint,
        data: request.toJson(),
      );

      // Handle backend response structure: {meta: {...}, data: {room: {...}, next_step: {...}}}
      final responseData = response.data is Map<String, dynamic>
          ? response.data as Map<String, dynamic>
          : {'data': response.data};

      final data = responseData['data'] ?? responseData;
      
      // Extract room object from data.room if it exists
      Map<String, dynamic> roomData;
      if (data is Map<String, dynamic> && data.containsKey('room')) {
        roomData = data['room'] as Map<String, dynamic>;
      } else if (data is Map<String, dynamic>) {
        roomData = data;
      } else {
        roomData = {};
      }
      
      return RoomModel.fromJson(roomData);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Get room details
  Future<RoomModel> getRoom(String roomCode) async {
    try {
      final response = await _dio.get(
        '${Env.roomsBaseUrl}/$roomCode',
      );

      // Handle backend response structure: {meta: {...}, data: {...}}
      final responseData = response.data is Map<String, dynamic>
          ? response.data as Map<String, dynamic>
          : {'data': response.data};

      final data = responseData['data'] ?? responseData;
      return RoomModel.fromJson(data is Map<String, dynamic> ? data : {});
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Join a room (POST /api/v1/rooms/create with roomCode)
  Future<UserRoomModel> joinRoom(String roomCode) async {
    try {
      final request = JoinRoomRequest(roomCode: roomCode);

      final response = await _dio.post(
        Env.joinRoomEndpoint,
        data: request.toJson(),
      );

      // Handle backend response structure: {meta: {...}, data: {...}}
      final responseData = response.data is Map<String, dynamic>
          ? response.data as Map<String, dynamic>
          : {'data': response.data};

      final data = responseData['data'] ?? responseData;
      return UserRoomModel.fromJson(data is Map<String, dynamic> ? data : {});
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Start game
  Future<void> startGame(String roomCode, RoleConfig roleConfig) async {
    try {
      final request = StartGameRequest(roleConfig: roleConfig);

      await _dio.post(
        '${Env.roomsBaseUrl}/$roomCode/start',
        data: request.toJson(),
      );

      // Handle backend response structure if needed
      // Response might be empty or have meta/data structure
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Configure roles
  Future<void> configureRoles(String roomCode, RoleConfig roleConfig) async {
    try {
      await _dio.post(
        '${Env.roomsBaseUrl}/$roomCode/role-config',
        data: roleConfig.toJson(),
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Get players in room
  Future<List<UserRoomModel>> getRoomPlayers(String roomCode) async {
    try {
      final response = await _dio.get(
        '${Env.roomsBaseUrl}/$roomCode/players',
      );

      // Handle backend response structure: {meta: {...}, data: {...}}
      final responseData = response.data is Map<String, dynamic>
          ? response.data as Map<String, dynamic>
          : {'data': response.data};

      final data = responseData['data'] ?? responseData;
      
      if (data is List) {
        return data
            .map((json) => UserRoomModel.fromJson(json as Map<String, dynamic>))
            .toList();
      }
      return [];
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Leave room
  Future<void> leaveRoom(String roomCode) async {
    try {
      await _dio.post(
        '${Env.apiBaseUrl}/v1/rooms/$roomCode/leave',
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Handle API errors
  Exception _handleError(DioException error) {
    if (error.response != null) {
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
      return Exception('Connection timeout. Please check your internet connection.');
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
        return 'Room not found.';
      case 409:
        return 'Already in room or room is full.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return 'An error occurred. Please try again.';
    }
  }
}

