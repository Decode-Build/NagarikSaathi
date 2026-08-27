class Student {
  final String id;
  final String fullName;
  final String rollNumber;
  final String department;
  final String section;

  Student({
    required this.id,
    required this.fullName,
    required this.rollNumber,
    required this.department,
    required this.section,
  });
}

class Teacher {
  final String id;
  final String fullName;
  final String employeeId;
  final String subject;

  Teacher({
    required this.id,
    required this.fullName,
    required this.employeeId,
    required this.subject,
  });
}

class AttendanceRecord {
  final String id;
  final String studentId;
  final DateTime date;
  final bool isPresent;
  final String subject;

  AttendanceRecord({
    required this.id,
    required this.studentId,
    required this.date,
    required this.isPresent,
    required this.subject,
  });
}
