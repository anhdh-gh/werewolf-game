class Env {
  // Backend base URL - update this to match your backend server
  static const String baseUrl = 'https://werewolf.anhdh.net';
  
  // API endpoints
  static const String apiBaseUrl = '$baseUrl/api';
  static const String authBaseUrl = '$apiBaseUrl/v1/auth';
  static const String usersBaseUrl = '$apiBaseUrl/v1/users';
  static const String roomsBaseUrl = '$apiBaseUrl/v1/rooms';
  
  // WebSocket URL
  static const String wsBaseUrl = 'wss://werewolf.anhdh.net';
  
  // Auth API endpoints
  static const String registerEndpoint = '$authBaseUrl/register';
  static const String loginEndpoint = '$authBaseUrl/login';
  static const String refreshTokenEndpoint = '$authBaseUrl/refresh';
  
  // User API endpoints
  static const String getUserInfoEndpoint = '$usersBaseUrl/info';
  static const String deleteAccountEndpoint = '$usersBaseUrl/delete';
  
  // Room API endpoints
  static const String createRoomEndpoint = '$roomsBaseUrl/create';
  static const String joinRoomEndpoint = '$roomsBaseUrl/create'; // Note: Same as create per your API
}

