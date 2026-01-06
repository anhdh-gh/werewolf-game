import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:werewolf_game_app/config/env.dart';
import 'package:werewolf_game_app/services/storage/server_storage.dart';
import 'package:werewolf_game_app/services/api/api_client.dart';

class ServerSelectionScreen extends StatefulWidget {
  const ServerSelectionScreen({super.key});

  @override
  State<ServerSelectionScreen> createState() => _ServerSelectionScreenState();
}

class _ServerSelectionScreenState extends State<ServerSelectionScreen> {
  final List<ServerOption> _servers = [
    ServerOption(
      name: 'Earth',
      baseUrl: 'https://werewolf.anhdh.net',
      wsBaseUrl: 'https://werewolf.anhdh.net',
      imagePath: 'images/img_earth.jpg',
    ),
    ServerOption(
      name: 'Mars',
      baseUrl: 'https://werewolf-s2.anhdh.net',
      wsBaseUrl: 'https://werewolf-s2.anhdh.net',
      imagePath: 'images/img_mars.png',
    ),
  ];

  String? _selectedServer;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadSelectedServer();
  }

  Future<void> _loadSelectedServer() async {
    // Ensure Env is initialized
    await Env.init();
    
    final savedUrl = await ServerStorage.getServerUrl();
    if (savedUrl != null) {
      setState(() {
        _selectedServer = savedUrl;
      });
      // Update Env with saved server
      final savedWsUrl = await ServerStorage.getWsServerUrl();
      if (savedWsUrl != null) {
        Env.updateServerUrls(savedUrl, savedWsUrl);
        apiClient.updateBaseUrl();
      }
    }
  }

  void _selectServer(ServerOption server) {
    setState(() {
      _selectedServer = server.baseUrl;
    });
  }

  Future<void> _handleContinue() async {
    if (_selectedServer == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a server'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      // Find selected server option
      final selectedServer = _servers.firstWhere(
        (server) => server.baseUrl == _selectedServer,
      );

      // Save server selection
      await ServerStorage.saveServerUrl(
        selectedServer.baseUrl,
        selectedServer.wsBaseUrl,
      );

      // Update Env with new server URLs
      Env.updateServerUrls(selectedServer.baseUrl, selectedServer.wsBaseUrl);

      // Reinitialize API client with new server
      apiClient.updateBaseUrl();

      if (mounted) {
        context.go('/login');
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          image: DecorationImage(
            image: AssetImage('images/img_werewolf.png'),
            fit: BoxFit.cover,
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(30.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    'Select Server',
                    style: TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      shadows: [
                        Shadow(
                          offset: Offset(2, 2),
                          blurRadius: 4,
                          color: Colors.black54,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 50),
                  ..._servers.map((server) => Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: _buildServerCard(server),
                  )),
                  const SizedBox(height: 30),
                  SizedBox(
                    width: double.infinity,
                    height: 55,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _handleContinue,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFDeb887),
                        disabledBackgroundColor: const Color(0xFFDeb887).withOpacity(0.5),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 5,
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.black87),
                              ),
                            )
                          : const Text(
                              'CONTINUE',
                              style: TextStyle(
                                color: Colors.black87,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 1.0,
                              ),
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildServerCard(ServerOption server) {
    final isSelected = _selectedServer == server.baseUrl;
    final goldColor = const Color(0xFFDeb887);
    
    return Card(
      color: isSelected 
          ? goldColor.withOpacity(0.9)
          : Colors.white.withOpacity(0.8),
      elevation: 5,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isSelected 
              ? goldColor
              : Colors.grey.withOpacity(0.3),
          width: isSelected ? 3 : 1,
        ),
      ),
      child: InkWell(
        onTap: _isLoading ? null : () => _selectServer(server),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Tên server bên trái
              Expanded(
                child: Text(
                  server.name,
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: isSelected ? Colors.black87 : Colors.black87,
                  ),
                ),
              ),
              const SizedBox(width: 16),
              // Ảnh server bên phải
              Stack(
                alignment: Alignment.topRight,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.asset(
                      server.imagePath,
                      width: 120,
                      height: 120,
                      fit: BoxFit.cover,
                    ),
                  ),
                  if (isSelected)
                    Container(
                      margin: const EdgeInsets.all(6),
                      decoration: const BoxDecoration(
                        color: Colors.green,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.check,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class ServerOption {
  final String name;
  final String baseUrl;
  final String wsBaseUrl;
  final String imagePath;

  ServerOption({
    required this.name,
    required this.baseUrl,
    required this.wsBaseUrl,
    required this.imagePath,
  });
}

