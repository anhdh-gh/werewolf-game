import 'package:go_router/go_router.dart';
import 'package:werewolf_game_app/providers/auth/auth_provider.dart';
import 'package:werewolf_game_app/screens/game/day_phase_screen.dart';
import 'package:werewolf_game_app/screens/game/game_master_screen.dart';
import 'package:werewolf_game_app/screens/game/night_phase_screen.dart';
import 'package:werewolf_game_app/screens/login/screen_login.dart';
import 'package:werewolf_game_app/screens/result/game_result_screen.dart';
import 'package:werewolf_game_app/screens/role/screen_role_reveal.dart';
import 'package:werewolf_game_app/screens/room/room_lobby_screen.dart';
import 'package:werewolf_game_app/screens/room/room_setup_screen.dart';
import 'package:werewolf_game_app/screens/startgame/join_game.dart';
import 'package:werewolf_game_app/screens/startgame/new_game.dart';
import 'package:werewolf_game_app/widgets/home_page.dart';

class AppRouter {
  static final router = GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      // Add auth guard logic here if needed
      return null;
    },
    routes: [
      GoRoute(
        path: '/',
        name: 'login',
        builder: (_, __) => const SignUpScreen(),
      ),
      GoRoute(
        path: '/home',
        name: 'home',
        builder: (_, __) => const HomePage(),
      ),
      GoRoute(
        path: '/new-game',
        name: 'new-game',
        builder: (_, __) => const ScreenNewGame(),
      ),
      GoRoute(
        path: '/join-game',
        name: 'join-game',
        builder: (_, __) => const ScreenJoinGame(),
      ),
      GoRoute(
        path: '/room/setup/:roomCode',
        name: 'room-setup',
        builder: (context, state) {
          final roomCode = state.pathParameters['roomCode']!;
          return RoomSetupScreen(roomCode: roomCode);
        },
      ),
      GoRoute(
        path: '/room/lobby/:roomCode',
        name: 'room-lobby',
        builder: (context, state) {
          final roomCode = state.pathParameters['roomCode']!;
          return RoomLobbyScreen(roomCode: roomCode);
        },
      ),
      GoRoute(
        path: '/game/master/:roomCode',
        name: 'game-master',
        builder: (context, state) {
          final roomCode = state.pathParameters['roomCode']!;
          return GameMasterScreen(roomCode: roomCode);
        },
      ),
      GoRoute(
        path: '/game/night/:roomCode',
        name: 'game-night',
        builder: (context, state) {
          final roomCode = state.pathParameters['roomCode']!;
          return NightPhaseScreen(roomCode: roomCode);
        },
      ),
      GoRoute(
        path: '/game/day/:roomCode',
        name: 'game-day',
        builder: (context, state) {
          final roomCode = state.pathParameters['roomCode']!;
          return DayPhaseScreen(roomCode: roomCode);
        },
      ),
      GoRoute(
        path: '/role/:playerRole?',
        name: 'role-reveal',
        builder: (context, state) {
          final playerRole = state.pathParameters['playerRole'];
          return RoleRevealScreen(playerRole: playerRole);
        },
      ),
      GoRoute(
        path: '/result/:roomCode',
        name: 'game-result',
        builder: (context, state) {
          final roomCode = state.pathParameters['roomCode']!;
          return GameResultScreen(roomCode: roomCode);
        },
      ),
    ],
  );
}
