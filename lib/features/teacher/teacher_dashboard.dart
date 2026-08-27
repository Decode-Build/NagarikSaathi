import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme.dart';
import '../../core/widgets/glass_card.dart';
import '../../services/mock_auth_service.dart';

class TeacherDashboard extends ConsumerWidget {
  const TeacherDashboard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final teacher = ref.watch(currentTeacherProvider);

    if (teacher == null) {
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
        title: const Text('Teacher Dashboard', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.picture_as_pdf, color: Colors.white),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Exporting Report as PDF...')),
              );
            },
            tooltip: 'Export Report',
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.white),
            onPressed: () {
              ref.read(currentTeacherProvider.notifier).state = null;
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
                // Teacher Profile
                GlassCard(
                  child: Row(
                    children: [
                       Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white.withOpacity(0.5), width: 2),
                        ),
                        child: CircleAvatar(
                          radius: 30,
                          backgroundColor: Colors.white.withOpacity(0.2),
                          child: const Icon(Icons.person, size: 36, color: Colors.white),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(teacher.fullName, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 18)),
                            const SizedBox(height: 4),
                            Text('Employee ID: ${teacher.employeeId}', style: TextStyle(color: Colors.white.withOpacity(0.8))),
                            Text('Subject: ${teacher.subject}', style: TextStyle(color: Colors.white.withOpacity(0.8))),
                          ],
                        ),
                      ),
                    ],
                  ),
                ).animate().fade(duration: 500.ms).slideY(begin: -0.1, end: 0),
                const SizedBox(height: 24),

                // Class Selection Dropdown
                GlassCard(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: 'CS Section A',
                      isExpanded: true,
                      dropdownColor: AppTheme.surfaceDark,
                      icon: const Icon(Icons.arrow_drop_down, color: Colors.white),
                      style: const TextStyle(color: Colors.white, fontSize: 16),
                      items: ['CS Section A', 'CS Section B', 'IT Section A']
                          .map((String value) {
                        return DropdownMenuItem<String>(
                          value: value,
                          child: Text(value),
                        );
                      }).toList(),
                      onChanged: (_) {},
                    ),
                  ),
                ).animate().fade(delay: 100.ms).slideY(begin: -0.1, end: 0),
                const SizedBox(height: 24),

                // Stats row
                Row(
                  children: [
                    Expanded(child: _buildStatCard(context, 'Total', '60', Colors.blueAccent)),
                    const SizedBox(width: 12),
                    Expanded(child: _buildStatCard(context, 'Present', '52', Colors.greenAccent)),
                    const SizedBox(width: 12),
                    Expanded(child: _buildStatCard(context, 'Absent', '8', Colors.redAccent)),
                  ],
                ).animate().fade(delay: 200.ms).scale(begin: const Offset(0.9, 0.9), end: const Offset(1, 1)),
                const SizedBox(height: 24),

                // Attendance Chart
                GlassCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text("Today's Attendance", style: theme.textTheme.titleLarge?.copyWith(color: Colors.white)),
                      const SizedBox(height: 16),
                      SizedBox(
                        height: 200,
                        child: PieChart(
                          PieChartData(
                            sections: [
                              PieChartSectionData(
                                color: Colors.greenAccent,
                                value: 52,
                                title: '86%',
                                radius: 60,
                                titleStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                              ),
                              PieChartSectionData(
                                color: Colors.redAccent,
                                value: 8,
                                title: '14%',
                                radius: 60,
                                titleStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                              ),
                            ],
                            centerSpaceRadius: 40,
                            sectionsSpace: 4,
                          ),
                        ),
                      ),
                    ],
                  ),
                ).animate().fade(delay: 300.ms).slideX(begin: -0.1, end: 0),
                const SizedBox(height: 24),

                // Student List Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Student List', style: theme.textTheme.titleLarge?.copyWith(color: Colors.white)),
                    TextButton.icon(
                      onPressed: () {},
                      icon: const Icon(Icons.filter_list, color: Colors.white),
                      label: const Text('Filter', style: TextStyle(color: Colors.white)),
                      style: TextButton.styleFrom(
                        backgroundColor: Colors.white.withOpacity(0.1),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ],
                ).animate().fade(delay: 400.ms),
                const SizedBox(height: 12),

                // Student List (Mock)
                ...[
                  _buildStudentListItem('CS-001', 'Alice Smith', true),
                  _buildStudentListItem('CS-002', 'Bob Jones', true),
                  _buildStudentListItem('CS-003', 'Charlie Brown', false),
                  _buildStudentListItem('CS-004', 'Diana Prince', true),
                  _buildStudentListItem('CS-005', 'Evan Wright', false),
                ].animate(interval: 100.ms).fade(delay: 500.ms).slideX(begin: 0.1, end: 0),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(BuildContext context, String title, String value, Color color) {
    return GlassCard(
      padding: const EdgeInsets.all(16.0),
      color: color,
      opacity: 0.1,
      child: Column(
        children: [
          Text(value, style: Theme.of(context).textTheme.headlineSmall?.copyWith(color: color, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(title, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white)),
        ],
      ),
    );
  }

  Widget _buildStudentListItem(String rollNo, String name, bool isPresent) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: GlassCard(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            CircleAvatar(
              backgroundColor: Colors.white.withOpacity(0.2),
              child: Text(name[0], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 16)),
                  Text(rollNo, style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 12)),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: isPresent ? Colors.greenAccent.withOpacity(0.2) : Colors.redAccent.withOpacity(0.2),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: isPresent ? Colors.greenAccent.withOpacity(0.5) : Colors.redAccent.withOpacity(0.5)),
              ),
              child: Text(
                isPresent ? 'Present' : 'Absent',
                style: TextStyle(color: isPresent ? Colors.greenAccent : Colors.redAccent, fontWeight: FontWeight.bold, fontSize: 12),
              ),
            ),
            const SizedBox(width: 8),
            IconButton(
              icon: const Icon(Icons.edit_note, color: Colors.white),
              onPressed: () {},
              tooltip: 'Manual Override',
            ),
          ],
        ),
      ),
    );
  }
}
