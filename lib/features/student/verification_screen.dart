import 'package:flutter/material.dart';
import '../../core/theme.dart';
import 'package:lucide_icons/lucide_icons.dart';

class VerificationScreen extends StatefulWidget {
  const VerificationScreen({super.key});

  @override
  State<VerificationScreen> createState() => _VerificationScreenState();
}

class _VerificationScreenState extends State<VerificationScreen> {
  int _currentStep = 0;
  bool _isProcessing = false;
  
  final List<String> _steps = [
    'Campus WiFi',
    'Classroom BLE',
    'Face Recognition',
    'Success'
  ];

  @override
  void initState() {
    super.initState();
    _startVerificationSequence();
  }

  void _startVerificationSequence() async {
    // Step 0 -> 1 (WiFi)
    await Future.delayed(const Duration(seconds: 2));
    if (!mounted) return;
    setState(() => _currentStep = 1);

    // Step 1 -> 2 (BLE)
    await Future.delayed(const Duration(seconds: 2));
    if (!mounted) return;
    setState(() => _currentStep = 2);

    // Step 2 -> 3 (Face - Fake camera delay)
    await Future.delayed(const Duration(seconds: 3));
    if (!mounted) return;
    setState(() => _currentStep = 3);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mark Attendance')),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            const Text(
              'Multi-Layer Verification',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text('Please wait while we verify your location and identity.'),
            const SizedBox(height: 32),

            Expanded(
              child: ListView.builder(
                itemCount: _steps.length,
                itemBuilder: (context, index) {
                  final isCompleted = _currentStep > index;
                  final isCurrent = _currentStep == index;
                  
                  IconData iconData;
                  Color iconColor;
                  
                  if (isCompleted) {
                    iconData = Icons.check_circle;
                    iconColor = Colors.green;
                  } else if (isCurrent) {
                    iconData = Icons.radio_button_checked;
                    iconColor = AppTheme.primaryBlue;
                  } else {
                    iconData = Icons.radio_button_unchecked;
                    iconColor = Colors.grey;
                  }

                  if (index == 3 && isCompleted) {
                    iconData = Icons.verified;
                    iconColor = AppTheme.primaryBlue;
                  }

                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    margin: const EdgeInsets.only(bottom: 24),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: isCurrent ? AppTheme.primaryBlue.withOpacity(0.05) : Colors.transparent,
                      border: Border.all(
                        color: isCurrent ? AppTheme.primaryBlue : (isCompleted ? Colors.green : Colors.grey.shade300),
                        width: isCurrent ? 2 : 1,
                      ),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      children: [
                        Icon(iconData, color: iconColor, size: 32),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _steps[index],
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: isCurrent || isCompleted ? FontWeight.bold : FontWeight.normal,
                                  color: isCurrent || isCompleted ? null : Colors.grey,
                                ),
                              ),
                              if (isCurrent && index < 3)
                                const Padding(
                                  padding: EdgeInsets.only(top: 8.0),
                                  child: LinearProgressIndicator(),
                                ),
                              if (isCurrent && index == 2)
                                _buildFakeCameraPreview(),
                              if (isCompleted && index == 0)
                                const Text('Connected to "College-Student-WiFi"', style: TextStyle(color: Colors.green)),
                              if (isCompleted && index == 1)
                                const Text('Found Beacon "CS-Room-101" (RSSI: -45dBm)', style: TextStyle(color: Colors.green)),
                              if (isCompleted && index == 2)
                                const Text('Face Match Confidence: 98.4%', style: TextStyle(color: Colors.green)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            
            if (_currentStep == 3)
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                  onPressed: () {
                    Navigator.of(context).pop();
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Attendance Marked Successfully!')),
                    );
                  },
                  child: const Text('Done'),
                ),
              )
          ],
        ),
      ),
    );
  }

  Widget _buildFakeCameraPreview() {
    return Container(
      margin: const EdgeInsets.only(top: 12),
      height: 150,
      decoration: BoxDecoration(
        color: Colors.black87,
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(LucideIcons.scanFace, color: Colors.white54, size: 48),
            SizedBox(height: 8),
            Text('Scanning Face...', style: TextStyle(color: Colors.white70)),
          ],
        ),
      ),
    );
  }
}
