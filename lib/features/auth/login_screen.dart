import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';
import '../../services/mock_auth_service.dart';
import '../../services/firebase_auth_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              AppTheme.primaryBlue.withOpacity(0.1),
              AppTheme.secondaryPurple.withOpacity(0.05),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 400),
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(32.0),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Logo / Title
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryBlue.withOpacity(0.1),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.fingerprint,
                            size: 48,
                            color: AppTheme.primaryBlue,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'AttendSure',
                          style: Theme.of(context).textTheme.displayMedium,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Sign in to mark or manage attendance',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.7),
                              ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 32),

                        // Tabs
                        TabBar(
                          controller: _tabController,
                          labelColor: AppTheme.primaryBlue,
                          unselectedLabelColor: Colors.grey,
                          indicatorColor: AppTheme.primaryBlue,
                          tabs: const [
                            Tab(text: 'Student'),
                            Tab(text: 'Teacher'),
                          ],
                        ),
                        const SizedBox(height: 24),

                        // Tab Views
                        SizedBox(
                          height: 360,
                          child: TabBarView(
                            controller: _tabController,
                            children: [
                              _StudentLoginForm(),
                              _TeacherLoginForm(),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _StudentLoginForm extends ConsumerStatefulWidget {
  @override
  ConsumerState<_StudentLoginForm> createState() => _StudentLoginFormState();
}

class _StudentLoginFormState extends ConsumerState<_StudentLoginForm> {
  final _nameController = TextEditingController();
  final _rollController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _nameController.dispose();
    _rollController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    setState(() => _isLoading = true);
    try {
      final authService = ref.read(firebaseAuthServiceProvider);
      final student = await authService.loginStudent(
        _nameController.text,
        _rollController.text,
      );
      
      ref.read(currentStudentProvider.notifier).state = student;
      ref.read(currentUserRoleProvider.notifier).state = 'student';
      
      if (mounted) {
        context.go('/student');
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        TextField(
          controller: _nameController,
          decoration: const InputDecoration(
            labelText: 'Full Name',
            prefixIcon: Icon(Icons.person_outline),
          ),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _rollController,
          decoration: const InputDecoration(
            labelText: 'Roll Number',
            prefixIcon: Icon(Icons.numbers),
          ),
        ),
        const SizedBox(height: 16),
        const Row(
          children: [
            Expanded(
              child: TextField(
                decoration: InputDecoration(
                  labelText: 'Department',
                  prefixIcon: Icon(Icons.domain),
                ),
              ),
            ),
            SizedBox(width: 16),
            Expanded(
              child: TextField(
                decoration: InputDecoration(
                  labelText: 'Class/Section',
                  prefixIcon: Icon(Icons.class_outlined),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          height: 50,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _handleLogin,
            child: _isLoading 
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('Login as Student'),
          ),
        ),
      ],
    );
  }
}

class _TeacherLoginForm extends ConsumerStatefulWidget {
  @override
  ConsumerState<_TeacherLoginForm> createState() => _TeacherLoginFormState();
}

class _TeacherLoginFormState extends ConsumerState<_TeacherLoginForm> {
  final _nameController = TextEditingController();
  final _empIdController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _nameController.dispose();
    _empIdController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    setState(() => _isLoading = true);
    try {
      final authService = ref.read(firebaseAuthServiceProvider);
      final teacher = await authService.loginTeacher(
        _nameController.text,
        _empIdController.text,
      );
      
      ref.read(currentTeacherProvider.notifier).state = teacher;
      ref.read(currentUserRoleProvider.notifier).state = 'teacher';
      
      if (mounted) {
        context.go('/teacher');
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        TextField(
          controller: _nameController,
          decoration: const InputDecoration(
            labelText: 'Teacher Name',
            prefixIcon: Icon(Icons.person_outline),
          ),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _empIdController,
          decoration: const InputDecoration(
            labelText: 'Employee ID',
            prefixIcon: Icon(Icons.badge_outlined),
          ),
        ),
        const SizedBox(height: 16),
        const TextField(
          decoration: InputDecoration(
            labelText: 'Subject',
            prefixIcon: Icon(Icons.book_outlined),
          ),
        ),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          height: 50,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _handleLogin,
            child: _isLoading 
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('Login as Teacher'),
          ),
        ),
      ],
    );
  }
}
