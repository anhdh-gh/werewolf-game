import 'package:dio/dio.dart';
import 'package:werewolf_game_app/config/env.dart';
import 'package:werewolf_game_app/services/storage/token_storage.dart';

class ApiClient {
  late final Dio _dio;

  ApiClient() {
    _dio = Dio(
      BaseOptions(
        baseUrl: Env.apiBaseUrl,
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

  void _setupInterceptors() {
    // Request interceptor - Add access token to headers
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await TokenStorage.getAccessToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (error, handler) async {
          // Handle 401 Unauthorized - Try to refresh token
          if (error.response?.statusCode == 401) {
            try {
              final refreshToken = await TokenStorage.getRefreshToken();
              if (refreshToken != null) {
                // Try to refresh token
                final refreshed = await _refreshToken(refreshToken);
                if (refreshed) {
                  // Retry the original request with new token
                  final opts = error.requestOptions;
                  final newToken = await TokenStorage.getAccessToken();
                  opts.headers['Authorization'] = 'Bearer $newToken';
                  final response = await _dio.fetch(opts);
                  return handler.resolve(response);
                }
              }
            } catch (e) {
              // Refresh failed, clear tokens and return error
              await TokenStorage.clearTokens();
            }
          }
          return handler.next(error);
        },
      ),
    );

    // Logging interceptor (for debugging)
    _dio.interceptors.add(
      LogInterceptor(
        requestBody: true,
        responseBody: true,
        error: true,
      ),
    );
  }

  Future<bool> _refreshToken(String refreshToken) async {
    try {
      // Create a new Dio instance without interceptors to avoid circular dependency
      final refreshDio = Dio(
        BaseOptions(
          baseUrl: Env.apiBaseUrl,
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
        final data = response.data;
        await TokenStorage.saveTokens(
          data['access_token'] ?? data['accessToken'],
          data['refresh_token'] ?? refreshToken,
        );
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  Dio get dio => _dio;
}

// Singleton instance
final apiClient = ApiClient();

