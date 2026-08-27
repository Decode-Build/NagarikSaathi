import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme.dart';
import '../../core/widgets/glass_card.dart';
import '../../services/mock_auth_service.dart';
import 'verification_screen.dart';

class StudentDashboard extends ConsumerWidget {
  const StudentDashboard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final student = ref.watch(currentStudentProvider);
    
    if (student == null) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('Session expired.'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => context.go('/login'),
                child: const Text('Back to Login'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('Dashboard', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.white),
            onPressed: () {
              ref.read(currentStudentProvider.notifier).state = null;
              ref.read(currentUserRoleProvider.notifier).state = null;
              context.go('/login');
            },
          ),
        ],
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: AppTheme.primaryGradient,
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Profile Card
                GlassCard(
                  padding: const EdgeInsets.all(20.0),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white.withOpacity(0.5), width: 2),
                        ),
                        child: CircleAvatar(
                          radius: 36,
                          backgroundColor: Colors.white.withOpacity(0.2),
                          child: const Icon(Icons.person, size: 40, color: Colors.white),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(student.fullName, style: theme.textTheme.titleLarge?.copyWith(color: Colors.white, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            Text('Roll No: ${student.rollNumber}', style: theme.textTheme.bodyMedium?.copyWith(color: Colors.white.withOpacity(0.9))),
                            const SizedBox(height: 2),
                            Text('${student.department} • ${student.section}', style: theme.textTheme.bodySmall?.copyWith(color: Colors.white.withOpacity(0.7))),
                          ],
                        ),
                      ),
                    ],
                  ),
                ).animate().fade(duration: 500.ms).slideY(begin: -0.1, end: 0),
                
                const SizedBox(height: 24),

                // Attendance Summary
                Row(
                  children: [
                    const Expanded(
                      child: _StatCard(
                        title: 'Overall',
                        value: '85%',
                        icon: Icons.pie_chart,
                        color: Colors.white,
                      ),
                    ).animate().fade(delay: 200.ms).slideX(begin: -0.1, end: 0),
                    const SizedBox(width: 16),
                    const Expanded(
                      child: _StatCard(
                        title: "Today's Status",
                        value: 'Pending',
                        icon: Icons.calendar_today,
                        color: Colors.orangeAccent,
                      ),
                    ).animate().fade(delay: 300.ms).slideX(begin: 0.1, end: 0),
                  ],
                ),
                const SizedBox(height: 24),

                // Mark Attendance Button
                SizedBox(
                  width: double.infinity,
                  height: 64,
                  child: ElevatedButton.icon(
                    icon: const Icon(Icons.fingerprint, size: 28, color: AppTheme.primaryBlue),
                    label: const Text('Mark Attendance', style: TextStyle(fontSize: 20, color: AppTheme.primaryBlue)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      elevation: 8,
                      shadowColor: Colors.black.withOpacity(0.3),
                    ),
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const VerificationScreen()),
                      );
                    },
                  ),
                ).animate(onPlay: (controller) => controller.repeat(reverse: true)).scale(begin: const Offset(1, 1), end: const Offset(1.02, 1.02), duration: 1.seconds),
                
                const SizedBox(height: 32),

                // Subject-wise attendance
                Text('Subject-wise Attendance', style: theme.textTheme.titleLarge?.copyWith(color: Colors.white)).animate().fade(delay: 400.ms),
                const SizedBox(height: 16),
                
                ...[
                  const _SubjectListTile(subject: 'Data Structures', percent: 90),
                  const _SubjectListTile(subject: 'Database Systems', percent: 82),
                  const _SubjectListTile(subject: 'Operating Systems', percent: 78),
                  const _SubjectListTile(subject: 'Computer Networks', percent: 88),
                ].animate(interval: 100.ms).fade(delay: 500.ms).slideX(begin: 0.2, end: 0),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color),
          const SizedBox(height: 12),
          Text(value, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 4),
          Text(title, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.white.withOpacity(0.8))),
        ],
      ),
    );
  }
}

class _SubjectListTile extends StatelessWidget {
  final String subject;
  final int percent;

  const _SubjectListTile({required this.subject, required this.percent});

  @override
  Widget build(BuildContext context) {
    final color = percent >= 80 ? Colors.greenAccent : (percent >= 75 ? Colors.orangeAccent : Colors.redAccent);
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: GlassCard(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(subject, style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.white, fontSize: 16)),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: percent / 100,
                      backgroundColor: Colors.white.withOpacity(0.2),
                      valueColor: AlwaysStoppedAnimation<Color>(color),
                      minHeight: 6,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: color.withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: color.withOpacity(0.5)),
              ),
              child: Text(
                '$percent%',
                style: TextStyle(color: color, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
