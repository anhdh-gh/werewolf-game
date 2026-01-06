import 'package:shared_preferences/shared_preferences.dart';

class ServerStorage {
  static const String _serverUrlKey = 'selected_server_url';
  static const String _wsServerUrlKey = 'selected_ws_server_url';

  // Save selected server URL
  static Future<void> saveServerUrl(String baseUrl, String wsBaseUrl) async {
    final prefs = await SharedPreferences.getInstance();
    await Future.wait([
      prefs.setString(_serverUrlKey, baseUrl),
      prefs.setString(_wsServerUrlKey, wsBaseUrl),
    ]);
  }

  // Get selected server URL
  static Future<String?> getServerUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_serverUrlKey);
  }

  // Get selected WebSocket server URL
  static Future<String?> getWsServerUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_wsServerUrlKey);
  }

  // Clear server selection
  static Future<void> clearServer() async {
    final prefs = await SharedPreferences.getInstance();
    await Future.wait([
      prefs.remove(_serverUrlKey),
      prefs.remove(_wsServerUrlKey),
    ]);
  }

  // Check if server is selected
  static Future<bool> hasServerSelected() async {
    final serverUrl = await getServerUrl();
    return serverUrl != null && serverUrl.isNotEmpty;
  }
}

