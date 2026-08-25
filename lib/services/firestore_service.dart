import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final firestoreProvider = Provider<FirebaseFirestore>((ref) {
  return FirebaseFirestore.instance;
});

final firestoreServiceProvider = Provider<FirestoreService>((ref) {
  return FirestoreService(ref.watch(firestoreProvider));
});

class FirestoreService {
  final FirebaseFirestore _firestore;

  FirestoreService(this._firestore);

  // Example: Add attendance record
  Future<void> addAttendanceRecord(String sessionId, String studentId, bool isPresent) async {
    await _firestore
        .collection('sessions')
        .doc(sessionId)
        .collection('attendance')
        .doc(studentId)
        .set({
      'isPresent': isPresent,
      'timestamp': FieldValue.serverTimestamp(),
    });
  }

  // Example: Get sessions for a teacher
  Stream<QuerySnapshot> getTeacherSessions(String teacherId) {
    return _firestore
        .collection('sessions')
        .where('teacherId', isEqualTo: teacherId)
        .orderBy('date', descending: true)
        .snapshots();
  }

  // Example: Get student attendance
  Stream<QuerySnapshot> getStudentAttendance(String studentId) {
    return _firestore
        .collectionGroup('attendance')
        .where(FieldPath.documentId, isEqualTo: studentId)
        .snapshots();
  }
}
