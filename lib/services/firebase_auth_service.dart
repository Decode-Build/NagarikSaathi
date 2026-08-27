import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart' as auth;
import '../models/models.dart';
import '../features/auth/auth_repository.dart';

final firebaseAuthServiceProvider = Provider((ref) {
  return FirebaseAuthService(ref.watch(authRepositoryProvider));
});

class FirebaseAuthService {
  final AuthRepository _authRepository;

  FirebaseAuthService(this._authRepository);

  Future<Student> loginStudent(String name, String rollNumber) async {
    // In a real app, you would sign in with email/password
    // Here we'll use a dummy email derived from rollNumber for Firebase Auth
    final email = '$rollNumber@student.attendsure.com'.replaceAll(' ', '').toLowerCase();
    
    try {
      await _authRepository.signInWithEmailAndPassword(email, 'password123');
    } catch (e) {
      // If user doesn't exist, create one
      await _authRepository.createUserWithEmailAndPassword(email, 'password123');
    }

    final user = _authRepository.currentUser;

    return Student(
      id: user?.uid ?? 'S001',
      fullName: name.isNotEmpty ? name : 'Student',
      rollNumber: rollNumber,
      department: 'Computer Science', // Fetch from Firestore in real app
      section: 'Section A',
    );
  }

  Future<Teacher> loginTeacher(String name, String empId) async {
    final email = '$empId@teacher.attendsure.com'.replaceAll(' ', '').toLowerCase();

    try {
      await _authRepository.signInWithEmailAndPassword(email, 'password123');
    } catch (e) {
      // If user doesn't exist, create one
      await _authRepository.createUserWithEmailAndPassword(email, 'password123');
    }

    final user = _authRepository.currentUser;

    return Teacher(
      id: user?.uid ?? 'T001',
      fullName: name.isNotEmpty ? name : 'Teacher',
      employeeId: empId,
      subject: 'Database Systems',
    );
  }
}
