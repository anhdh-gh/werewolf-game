import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:werewolf_game_app/models/auth/user_model.dart';
import 'package:werewolf_game_app/services/api/auth_api_service.dart';
import 'package:werewolf_game_app/services/storage/token_storage.dart';

// Auth API Service Provider
final authApiServiceProvider = Provider<AuthApiService>((ref) {
  return AuthApiService();
});

// Current User Provider
final currentUserProvider = StateProvider<UserModel?>((ref) => null);

// Auth State Provider (logged in or not)
final authStateProvider = FutureProvider<bool>((ref) async {
  return await TokenStorage.isLoggedIn();
});

// Register Provider
final registerProvider =
    StateNotifierProvider<RegisterNotifier, AsyncValue<void>>((ref) {
  return RegisterNotifier(ref);
});

class RegisterNotifier extends StateNotifier<AsyncValue<void>> {
  final Ref ref;

  RegisterNotifier(this.ref) : super(const AsyncValue.data(null));

  Future<void> register({
    required String email,
    required String username,
    required String password,
  }) async {
    state = const AsyncValue.loading();

    try {
      final authService = ref.read(authApiServiceProvider);
      final registerResponse = await authService.register(
        email: email,
        username: username,
        password: password,
      );

      // Register doesn't return tokens, so we need to login after registration
      // Update current user with registered user info
      ref.read(currentUserProvider.notifier).state = registerResponse.data;

      // Automatically login after successful registration
      try {
        final loginResponse = await authService.login(
          username: username,
          password: password,
        );

      // Save tokens from login
      await TokenStorage.saveTokens(
        loginResponse.accessToken,
        loginResponse.refreshToken,
      );

      // Update current user - use login response user if available, otherwise keep registered user
      if (loginResponse.user != null) {
        ref.read(currentUserProvider.notifier).state = loginResponse.user;
      }
      // If login doesn't return user info, keep the registered user info
      } catch (loginError) {
        // If auto-login fails, still consider registration successful
        // User can manually login later
        // Just keep the registered user info
      }

      state = const AsyncValue.data(null);
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      rethrow;
    }
  }
}

// Login Provider
final loginProvider =
    StateNotifierProvider<LoginNotifier, AsyncValue<void>>((ref) {
  return LoginNotifier(ref);
});

class LoginNotifier extends StateNotifier<AsyncValue<void>> {
  final Ref ref;

  LoginNotifier(this.ref) : super(const AsyncValue.data(null));

  Future<void> login({
    required String username,
    required String password,
  }) async {
    state = const AsyncValue.loading();

    try {
      final authService = ref.read(authApiServiceProvider);
      final response = await authService.login(
        username: username,
        password: password,
      );

      // Save tokens
      await TokenStorage.saveTokens(
        response.accessToken,
        response.refreshToken,
      );

      // Get user info after login (login response doesn't include user info)
      try {
        final user = await authService.getCurrentUser();
        ref.read(currentUserProvider.notifier).state = user;
      } catch (e) {
        // If getCurrentUser fails, try to use user from response if available
        if (response.user != null) {
          ref.read(currentUserProvider.notifier).state = response.user;
        }
        // If both fail, user info will be null but tokens are saved
        // User can still use the app, just won't see their info
      }

      state = const AsyncValue.data(null);
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      rethrow;
    }
  }
}

// Logout Provider
final logoutProvider = Provider<void Function()>((ref) {
  return () async {
    await TokenStorage.clearTokens();
    ref.read(currentUserProvider.notifier).state = null;
    ref.invalidate(authStateProvider);
  };
});

// Refresh Token Provider
final refreshTokenProvider =
    StateNotifierProvider<RefreshTokenNotifier, AsyncValue<void>>((ref) {
  return RefreshTokenNotifier(ref);
});

class RefreshTokenNotifier extends StateNotifier<AsyncValue<void>> {
  final Ref ref;

  RefreshTokenNotifier(this.ref) : super(const AsyncValue.data(null));

  Future<void> refreshToken() async {
    try {
      final refreshToken = await TokenStorage.getRefreshToken();
      if (refreshToken == null) {
        throw Exception('No refresh token available');
      }

      final authService = ref.read(authApiServiceProvider);
      final response = await authService.refreshToken(refreshToken);

      // Save new tokens
      await TokenStorage.saveTokens(
        response.accessToken,
        response.refreshToken,
      );

      // Update current user
      ref.read(currentUserProvider.notifier).state = response.user;

      state = const AsyncValue.data(null);
    } catch (e) {
      // If refresh fails, clear tokens
      await TokenStorage.clearTokens();
      ref.read(currentUserProvider.notifier).state = null;
      state = AsyncValue.error(e, StackTrace.current);
      rethrow;
    }
  }
}

