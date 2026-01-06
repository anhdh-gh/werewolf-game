// werewolf_game_app/lib/config/app_router.dart
import 'package:go_router/go_router.dart';
import 'package:werewolf_game_app/screens/login/screen_login.dart';
import 'package:werewolf_game_app/screens/server_selection/screen_server_selection.dart';
import 'package:werewolf_game_app/screens/startgame/join_game.dart';
import 'package:werewolf_game_app/screens/startgame/new_game.dart';
import 'package:werewolf_game_app/screens/startgame/screen_role_reveal.dart';
import 'package:werewolf_game_app/screens/waiting/screen_game.dart';
import 'package:werewolf_game_app/screens/game/night/screen_night_seer.dart';
import 'package:werewolf_game_app/screens/game/night/screen_night_wolf.dart';
import 'package:werewolf_game_app/widgets/home_page.dart';

class AppRouter {
  static final router = GoRouter(
    initialLocation: '/server-selection',
    redirect: (context, state) {
      return null;
    },
    routes: [
      GoRoute(
        path: '/server-selection',
        name: 'server-selection',
        builder: (_, __) => const ServerSelectionScreen(),
      ),
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (_, __) => const SignUpScreen(),
      ),
      GoRoute(
        path: '/',
        name: 'login-root',
        redirect: (_, __) => '/login',
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
        routes: [
          GoRoute(
            path: ':roomCode',
            name: 'new-game-with-code',
            builder: (context, state) {
              final roomCode = state.pathParameters['roomCode'];
              return ScreenNewGame(
                roomCode: roomCode,
              );
            },
          ),
        ],
      ),
      GoRoute(
        path: '/join-game',
        name: 'join-game',
        builder: (_, __) => const ScreenJoinGame(),
      ),
      GoRoute(
        path: '/role-reveal',
        name: 'role-reveal',
        builder: (_, __) => const ScreenRoleReveal(),
      ),
      GoRoute(
        path: '/game',
        name: 'game',
        builder: (_, __) => const ScreenGame(),
        routes: [
          GoRoute(
            path: 'night/seer',
            name: 'night-seer',
            builder: (_, __) => const ScreenNightSeer(),
          ),
          GoRoute(
            path: 'night/wolf',
            name: 'night-wolf',
            builder: (_, __) => const ScreenNightWolf(),
          ),
        ],
      ),
    ],
  );
}