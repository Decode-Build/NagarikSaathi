import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/login_screen.dart';
import '../features/student/student_dashboard.dart';
import '../features/teacher/teacher_dashboard.dart';

final GlobalKey<NavigatorState> _rootNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'root');

final goRouter = GoRouter(
  navigatorKey: _rootNavigatorKey,
  initialLocation: '/login',
  routes: [
    GoRoute(
      path: '/login',
      name: 'login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/student',
      name: 'student_dashboard',
      builder: (context, state) => const StudentDashboard(),
    ),
    GoRoute(
      path: '/teacher',
      name: 'teacher_dashboard',
      builder: (context, state) => const TeacherDashboard(),
    ),
  ],
);
