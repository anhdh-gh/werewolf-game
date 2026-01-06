import 'package:dio/dio.dart';
import 'package:werewolf_game_app/config/env.dart';
import 'package:werewolf_game_app/services/storage/token_storage.dart';
import 'dart:developer' as developer;

class ApiClient {
  Dio? _dio;
  String? _currentBaseUrl;

  ApiClient() {
    _initialize();
  }

  void _initialize() {
    final baseUrl = Env.apiBaseUrl;
    _currentBaseUrl = baseUrl;
    _dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _setupInterceptors();
  }

  // Update base URL and reinitialize Dio
  void updateBaseUrl() {
    final newBaseUrl = Env.apiBaseUrl;
    if (_currentBaseUrl != newBaseUrl) {
      _currentBaseUrl = newBaseUrl;
      _dio = Dio(
        BaseOptions(
          baseUrl: newBaseUrl,
          connectTimeout: const Duration(seconds: 30),
          receiveTimeout: const Duration(seconds: 30),
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );
      _setupInterceptors();
      developer.log('🔄 [API] Base URL updated to: $newBaseUrl');
    }
  }

  void _setupInterceptors() {
    if (_dio == null) return;
    
    // Request interceptor - Add access token to headers
    _dio!.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await TokenStorage.getAccessToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
            developer.log('🔑 [API] Adding token to request: ${options.path}');
          } else {
            developer.log('⚠️ [API] No token found for request: ${options.path}');
          }
          return handler.next(options);
        },
        onError: (error, handler) async {
          developer.log('❌ [API] Error ${error.response?.statusCode}: ${error.requestOptions.path}');
          
          // Handle 401 Unauthorized - Try to refresh token
          if (error.response?.statusCode == 401) {
            try {
              final refreshToken = await TokenStorage.getRefreshToken();
              if (refreshToken != null) {
                developer.log('🔄 [API] Attempting token refresh...');
                // Try to refresh token
                final refreshed = await _refreshToken(refreshToken);
                if (refreshed && _dio != null) {
                  developer.log('✅ [API] Token refreshed, retrying request');
                  // Retry the original request with new token
                  final opts = error.requestOptions;
                  final newToken = await TokenStorage.getAccessToken();
                  opts.headers['Authorization'] = 'Bearer $newToken';
                  final response = await _dio!.fetch(opts);
                  return handler.resolve(response);
                } else {
                  developer.log('❌ [API] Token refresh failed');
                }
              } else {
                developer.log('⚠️ [API] No refresh token available');
              }
            } catch (e) {
              developer.log('❌ [API] Refresh error: $e');
              // Refresh failed, clear tokens and return error
              await TokenStorage.clearTokens();
            }
          }
          return handler.next(error);
        },
      ),
    );

    // Logging interceptor (for debugging)
    _dio!.interceptors.add(
      LogInterceptor(
        requestBody: true,
        responseBody: true,
        error: true,
        logPrint: (obj) => developer.log(obj.toString(), name: 'DIO'),
      ),
    );
  }

  Future<bool> _refreshToken(String refreshToken) async {
    try {
      // Create a new Dio instance without interceptors to avoid circular dependency
      final refreshDio = Dio(
        BaseOptions(
          baseUrl: _currentBaseUrl ?? Env.apiBaseUrl,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      final response = await refreshDio.post(
        Env.refreshTokenEndpoint,
        data: {'refresh_token': refreshToken},
      );
      
      if (response.statusCode == 200) {
        // ⚠️ FIX: Handle your backend response structure {meta: {...}, data: {...}}
        final responseData = response.data is Map<String, dynamic>
            ? response.data as Map<String, dynamic>
            : {'data': response.data};
        
        final data = responseData['data'] ?? responseData;
        
        // Get tokens from response
        final newAccessToken = data['access_token'] ?? data['accessToken'];
        final newRefreshToken = data['refresh_token'] ?? data['refreshToken'] ?? refreshToken;
        
        if (newAccessToken != null) {
          await TokenStorage.saveTokens(newAccessToken, newRefreshToken);
          developer.log('✅ [API] New tokens saved');
          return true;
        }
      }
      return false;
    } catch (e) {
      developer.log('❌ [API] Refresh token exception: $e');
      return false;
    }
  }

  Dio get dio {
    if (_dio == null) {
      _initialize();
    }
    return _dio!;
  }
}

// Singleton instance
final apiClient = ApiClient();