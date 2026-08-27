import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/models.dart';

final authServiceProvider = Provider((ref) => MockAuthService());

// Global state providers for the currently logged in user
final currentUserRoleProvider = StateProvider<String?>((ref) => null); // 'student' or 'teacher'
final currentStudentProvider = StateProvider<Student?>((ref) => null);
final currentTeacherProvider = StateProvider<Teacher?>((ref) => null);

class MockAuthService {
  Future<Student> loginStudent(String name, String rollNumber) async {
    await Future.delayed(const Duration(seconds: 1)); // Simulate network request
    return Student(
      id: 'S001',
      fullName: name.isNotEmpty ? name : 'John Doe',
      rollNumber: rollNumber.isNotEmpty ? rollNumber : 'CS-2023-042',
      department: 'Computer Science',
      section: 'Section A',
    );
  }

  Future<Teacher> loginTeacher(String name, String empId) async {
    await Future.delayed(const Duration(seconds: 1)); // Simulate network request
    return Teacher(
      id: 'T001',
      fullName: name.isNotEmpty ? name : 'Dr. Sarah Connor',
      employeeId: empId.isNotEmpty ? empId : 'EMP-9021',
      subject: 'Database Systems',
    );
  }
}
