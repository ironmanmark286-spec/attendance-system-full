import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

// Your backend URL
const String baseUrl = "http://localhost:5000";

void main() {
  runApp(const AdminApp());
}

// ===== THEME CONSTANTS =====
const Color primaryColor = Color(0xFF6366F1); // Indigo
const Color bgColor = Color(0xFF0F172A); // Slate 900
const Color surfaceColor = Color(0xFF1E293B); // Slate 800
const Color textPrimary = Colors.white;
const Color textSecondary = Color(0xFF94A3B8); // Slate 400

class AdminApp extends StatelessWidget {
  const AdminApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Attendance Admin',
      theme: ThemeData.dark().copyWith(
        primaryColor: primaryColor,
        scaffoldBackgroundColor: bgColor,
        cardColor: surfaceColor,
        appBarTheme: const AppBarTheme(
          backgroundColor: surfaceColor,
          elevation: 0,
          centerTitle: false,
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: primaryColor,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            padding: const EdgeInsets.symmetric(vertical: 16),
            elevation: 0,
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: bgColor,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none,
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: primaryColor, width: 2),
          ),
          labelStyle: const TextStyle(color: textSecondary),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        ),
        colorScheme: ColorScheme.dark(
          primary: primaryColor,
          surface: surfaceColor,
          background: bgColor,
        ),
      ),
      home: const AuthCheck(),
      debugShowCheckedModeBanner: false,
    );
  }
}

// ===== AUTH CHECKER =====
class AuthCheck extends StatefulWidget {
  const AuthCheck({Key? key}) : super(key: key);
  @override
  State<AuthCheck> createState() => _AuthCheckState();
}

class _AuthCheckState extends State<AuthCheck> {
  @override
  void initState() {
    super.initState();
    _checkToken();
  }

  Future<void> _checkToken() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    await Future.delayed(const Duration(milliseconds: 500)); // Small delay for splash effect
    if (token != null && token.isNotEmpty) {
      if (mounted) Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const DashboardScreen()));
    } else {
      if (mounted) Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
    }
  }

  @override
  Widget build(BuildContext context) => const Scaffold(body: Center(child: CircularProgressIndicator(color: primaryColor)));
}

// ===== LOGIN SCREEN =====
class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _companyCodeCtrl = TextEditingController(text: "CMP-01");
  final _usernameCtrl = TextEditingController(text: "admin");
  final _passwordCtrl = TextEditingController(text: "Admin@123");
  String msg = "";
  bool isLoading = false;

  Future<void> _login() async {
    setState(() { isLoading = true; msg = ""; });
    try {
      final response = await http.post(
        Uri.parse("$baseUrl/auth/login"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "companyCode": _companyCodeCtrl.text,
          "username": _usernameCtrl.text,
          "password": _passwordCtrl.text,
        }),
      );
      final data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', data['token']);
        await prefs.setString('role', data['role']);
        if (mounted) Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const DashboardScreen()));
      } else {
        setState(() => msg = data['message'] ?? "Login failed");
      }
    } catch (e) {
      setState(() => msg = "Server error. Is backend running?");
    } finally {
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Container(
          width: 420,
          padding: const EdgeInsets.all(40),
          decoration: BoxDecoration(
            color: surfaceColor,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: Colors.white.withOpacity(0.05)),
            boxShadow: [
              BoxShadow(color: Colors.black.withOpacity(0.3), blurRadius: 30, offset: const Offset(0, 15)),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Icon(Icons.fingerprint, size: 64, color: primaryColor),
              const SizedBox(height: 24),
              const Text("Admin Portal", textAlign: TextAlign.center, style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, letterSpacing: 1)),
              const SizedBox(height: 8),
              const Text("Sign in to manage attendance", textAlign: TextAlign.center, style: TextStyle(color: textSecondary, fontSize: 16)),
              const SizedBox(height: 32),
              TextField(
                controller: _companyCodeCtrl,
                decoration: const InputDecoration(labelText: "Company Code", prefixIcon: Icon(Icons.business_outlined, color: textSecondary)),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _usernameCtrl,
                decoration: const InputDecoration(labelText: "Username", prefixIcon: Icon(Icons.person_outline, color: textSecondary)),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _passwordCtrl,
                obscureText: true,
                decoration: const InputDecoration(labelText: "Password", prefixIcon: Icon(Icons.lock_outline, color: textSecondary)),
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: isLoading ? null : _login,
                style: ElevatedButton.styleFrom(
                  backgroundColor: primaryColor,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: isLoading
                    ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text("Sign In", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ),
              if (msg.isNotEmpty) ...[
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: Colors.red.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                  child: Text(msg, textAlign: TextAlign.center, style: const TextStyle(color: Colors.redAccent)),
                )
              ],
            ],
          ),
        ),
      ),
    );
  }
}

// ===== DASHBOARD SCREEN =====
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({Key? key}) : super(key: key);
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> with SingleTickerTickerProviderStateMixin {
  late TabController _tabController;
  bool isLoading = false;

  // Attendance State
  Map<String, dynamic> stats = {"total": 0, "present": 0, "late": 0, "absent": 0};
  List<dynamic> attendanceRows = [];

  // Employees State
  List<dynamic> employees = [];
  final _empCodeCtrl = TextEditingController();
  final _empNameCtrl = TextEditingController();
  final _empPassCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      if (_tabController.indexIsChanging) {
        _tabController.index == 0 ? _loadAttendance() : _loadEmployees();
      }
    });
    _loadAttendance();
  }

  Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    return {
      "Content-Type": "application/json",
      "Authorization": "Bearer ${prefs.getString('token')}"
    };
  }

  Future<void> _loadAttendance() async {
    setState(() => isLoading = true);
    try {
      final headers = await _getHeaders();
      final attRes = await http.get(Uri.parse("$baseUrl/attendance/today"), headers: headers);
      final statRes = await http.get(Uri.parse("$baseUrl/attendance/stats/today"), headers: headers);

      if (attRes.statusCode == 200 && statRes.statusCode == 200) {
        setState(() {
          attendanceRows = jsonDecode(attRes.body);
          stats = jsonDecode(statRes.body);
        });
      }
    } catch (e) {
      debugPrint("Error loading attendance: $e");
    } finally {
      setState(() => isLoading = false);
    }
  }

  Future<void> _loadEmployees() async {
    setState(() => isLoading = true);
    try {
      final headers = await _getHeaders();
      final res = await http.get(Uri.parse("$baseUrl/employees"), headers: headers);
      if (res.statusCode == 200) {
        setState(() => employees = jsonDecode(res.body));
      }
    } catch (e) {
      debugPrint("Error loading employees: $e");
    } finally {
      setState(() => isLoading = false);
    }
  }

  Future<void> _addEmployee() async {
    try {
      final headers = await _getHeaders();
      final res = await http.post(
        Uri.parse("$baseUrl/employees"),
        headers: headers,
        body: jsonEncode({
          "empCode": _empCodeCtrl.text,
          "name": _empNameCtrl.text,
          "password": _empPassCtrl.text
        }),
      );
      if (res.statusCode == 201) {
        _empCodeCtrl.clear(); _empNameCtrl.clear(); _empPassCtrl.clear();
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: const Text("Employee Added Successfully!"), backgroundColor: Colors.green.shade600));
        _loadEmployees();
      } else {
        final data = jsonDecode(res.body);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(data['message'] ?? "Error"), backgroundColor: Colors.redAccent));
      }
    } catch (e) {
      debugPrint("Error adding employee: $e");
    }
  }

  Future<void> _toggleStatus(int id, String currentStatus) async {
    final newStatus = currentStatus == 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      final headers = await _getHeaders();
      await http.put(Uri.parse("$baseUrl/employees/$id/status"), headers: headers, body: jsonEncode({"status": newStatus}));
      _loadEmployees();
    } catch (e) { debugPrint("Error toggling status: $e"); }
  }

  Future<void> _deleteEmployee(int id) async {
    try {
      final headers = await _getHeaders();
      await http.delete(Uri.parse("$baseUrl/employees/$id"), headers: headers);
      _loadEmployees();
    } catch (e) { debugPrint("Error deleting employee: $e"); }
  }

  void _logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    if (mounted) Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
  }

  String _formatMins(dynamic mins) {
    if (mins == null) return "-";
    int m = mins is int ? mins : int.tryParse(mins.toString()) ?? 0;
    return "${m ~/ 60}h ${m % 60}m";
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        toolbarHeight: 80,
        title: Padding(
          padding: const EdgeInsets.only(left: 16.0),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: primaryColor.withOpacity(0.2), borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.dashboard_rounded, color: primaryColor),
              ),
              const SizedBox(width: 16),
              const Text("Admin Workspace", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 22)),
            ],
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: textSecondary),
            tooltip: 'Refresh Data',
            onPressed: _tabController.index == 0 ? _loadAttendance : _loadEmployees,
          ),
          const SizedBox(width: 8),
          Padding(
            padding: const EdgeInsets.only(right: 24.0, top: 18, bottom: 18),
            child: ElevatedButton.icon(
              icon: const Icon(Icons.logout_rounded, size: 18),
              label: const Text("Logout"),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.redAccent.withOpacity(0.1),
                foregroundColor: Colors.redAccent,
                elevation: 0,
                padding: const EdgeInsets.symmetric(horizontal: 20),
              ),
              onPressed: _logout,
            ),
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(60),
          child: Align(
            alignment: Alignment.centerLeft,
            child: Padding(
              padding: const EdgeInsets.only(left: 32.0, bottom: 8),
              child: TabBar(
                controller: _tabController,
                isScrollable: true,
                indicator: BoxDecoration(
                  borderRadius: BorderRadius.circular(30),
                  color: primaryColor,
                ),
                indicatorSize: TabBarIndicatorSize.tab,
                labelColor: Colors.white,
                unselectedLabelColor: textSecondary,
                labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                padding: EdgeInsets.zero,
                tabs: const [
                  Padding(padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12), child: Text("Live Attendance")),
                  Padding(padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12), child: Text("Manage Employees")),
                ],
              ),
            ),
          ),
        ),
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator(color: primaryColor))
          : TabBarView(
              controller: _tabController,
              children: [
                _buildAttendanceTab(),
                _buildEmployeesTab(),
              ],
            ),
    );
  }

  // --- ATTENDANCE UI ---
  Widget _buildAttendanceTab() {
    return ListView(
      padding: const EdgeInsets.all(32),
      children: [
        // Stats Cards
        Row(
          children: [
            _statCard("Total Staff", stats['total'].toString(), Icons.people_alt, Colors.blue),
            _statCard("Present", stats['present'].toString(), Icons.check_circle, Colors.green),
            _statCard("Late", stats['late'].toString(), Icons.schedule, Colors.orange),
            _statCard("Absent", stats['absent'].toString(), Icons.cancel, Colors.red),
          ],
        ),
        const SizedBox(height: 32),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text("Today's Attendance Logs", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            Text("${attendanceRows.length} records found", style: const TextStyle(color: textSecondary)),
          ],
        ),
        const SizedBox(height: 16),
        Container(
          width: double.infinity,
          decoration: BoxDecoration(
            color: surfaceColor,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white.withOpacity(0.05)),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: DataTable(
                headingRowColor: MaterialStateProperty.all(bgColor.withOpacity(0.5)),
                dataRowMinHeight: 60,
                dataRowMaxHeight: 60,
                columns: const [
                  DataColumn(label: Text("Employee", style: TextStyle(fontWeight: FontWeight.bold, color: textSecondary))),
                  DataColumn(label: Text("Code", style: TextStyle(fontWeight: FontWeight.bold, color: textSecondary))),
                  DataColumn(label: Text("In Time", style: TextStyle(fontWeight: FontWeight.bold, color: textSecondary))),
                  DataColumn(label: Text("Out Time", style: TextStyle(fontWeight: FontWeight.bold, color: textSecondary))),
                  DataColumn(label: Text("Duration", style: TextStyle(fontWeight: FontWeight.bold, color: textSecondary))),
                  DataColumn(label: Text("Status", style: TextStyle(fontWeight: FontWeight.bold, color: textSecondary))),
                ],
                rows: attendanceRows.map((r) {
                  return DataRow(cells: [
                    DataCell(Row(
                      children: [
                        CircleAvatar(
                          backgroundColor: primaryColor.withOpacity(0.2),
                          foregroundColor: primaryColor,
                          child: Text(r['name'].toString().substring(0, 1).toUpperCase()),
                        ),
                        const SizedBox(width: 12),
                        Text(r['name'].toString(), style: const TextStyle(fontWeight: FontWeight.w600)),
                      ],
                    )),
                    DataCell(Text(r['emp_code'].toString(), style: const TextStyle(color: textSecondary))),
                    DataCell(Text(r['check_in'] != null ? r['check_in'].toString().substring(11, 16) : "-", style: const TextStyle(fontWeight: FontWeight.w500))),
                    DataCell(Text(r['check_out'] != null ? r['check_out'].toString().substring(11, 16) : "-", style: const TextStyle(fontWeight: FontWeight.w500))),
                    DataCell(Text(_formatMins(r['total_minutes']), style: const TextStyle(color: textSecondary))),
                    DataCell(_statusBadge(r['status'].toString())),
                  ]);
                }).toList(),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _statCard(String title, String value, IconData icon, MaterialColor color) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 8),
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [color.shade800.withOpacity(0.8), color.shade900.withOpacity(0.6)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [BoxShadow(color: color.withOpacity(0.2), blurRadius: 15, offset: const Offset(0, 8))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(title.toUpperCase(), style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 13, fontWeight: FontWeight.bold, letterSpacing: 1)),
                Icon(icon, color: Colors.white.withOpacity(0.8), size: 24),
              ],
            ),
            const SizedBox(height: 16),
            Text(value, style: const TextStyle(fontSize: 36, fontWeight: FontWeight.bold, color: Colors.white)),
          ],
        ),
      ),
    );
  }

  Widget _statusBadge(String status) {
    Color color = status == "PRESENT" ? Colors.greenAccent : (status == "LATE" ? Colors.orangeAccent : Colors.redAccent);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(color: color.withOpacity(0.15), borderRadius: BorderRadius.circular(20), border: Border.all(color: color.withOpacity(0.3))),
      child: Text(status, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
    );
  }

  // --- EMPLOYEES UI ---
  Widget _buildEmployeesTab() {
    return Padding(
      padding: const EdgeInsets.all(32),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Add Form
          Expanded(
            flex: 1,
            child: Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: surfaceColor,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white.withOpacity(0.05)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(color: primaryColor.withOpacity(0.2), borderRadius: BorderRadius.circular(8)),
                        child: const Icon(Icons.person_add_alt_1, color: primaryColor),
                      ),
                      const SizedBox(width: 16),
                      const Text("New Employee", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 32),
                  TextField(controller: _empCodeCtrl, decoration: const InputDecoration(labelText: "Employee Code (e.g. EMP-02)", prefixIcon: Icon(Icons.badge_outlined))),
                  const SizedBox(height: 16),
                  TextField(controller: _empNameCtrl, decoration: const InputDecoration(labelText: "Full Name", prefixIcon: Icon(Icons.person_outline))),
                  const SizedBox(height: 16),
                  TextField(controller: _empPassCtrl, obscureText: true, decoration: const InputDecoration(labelText: "Initial Password", prefixIcon: Icon(Icons.lock_outline))),
                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _addEmployee,
                      icon: const Icon(Icons.add),
                      label: const Text("Create Account", style: TextStyle(fontSize: 16)),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 32),
          // Employee List Table
          Expanded(
            flex: 2,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text("Staff Directory", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                    Text("${employees.length} total members", style: const TextStyle(color: textSecondary)),
                  ],
                ),
                const SizedBox(height: 16),
                Expanded(
                  child: Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: surfaceColor,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.white.withOpacity(0.05)),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: SingleChildScrollView(
                        child: DataTable(
                          headingRowColor: MaterialStateProperty.all(bgColor.withOpacity(0.5)),
                          dataRowMinHeight: 64,
                          dataRowMaxHeight: 64,
                          columns: const [
                            DataColumn(label: Text("Profile", style: TextStyle(fontWeight: FontWeight.bold, color: textSecondary))),
                            DataColumn(label: Text("Emp Code", style: TextStyle(fontWeight: FontWeight.bold, color: textSecondary))),
                            DataColumn(label: Text("Status", style: TextStyle(fontWeight: FontWeight.bold, color: textSecondary))),
                            DataColumn(label: Text("Actions", style: TextStyle(fontWeight: FontWeight.bold, color: textSecondary))),
                          ],
                          rows: employees.map((e) {
                            bool isActive = e['status'] == 'ACTIVE';
                            return DataRow(cells: [
                              DataCell(Row(
                                children: [
                                  CircleAvatar(
                                    backgroundColor: (isActive ? Colors.green : Colors.grey).withOpacity(0.2),
                                    foregroundColor: isActive ? Colors.green : Colors.grey,
                                    child: Text(e['name'].toString().substring(0, 1).toUpperCase()),
                                  ),
                                  const SizedBox(width: 12),
                                  Text(e['name'].toString(), style: const TextStyle(fontWeight: FontWeight.w600)),
                                ],
                              )),
                              DataCell(Text(e['emp_code'].toString(), style: const TextStyle(color: textSecondary))),
                              DataCell(
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: (isActive ? Colors.green : Colors.grey).withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(e['status'].toString(), style: TextStyle(color: isActive ? Colors.greenAccent : Colors.grey, fontSize: 12, fontWeight: FontWeight.bold)),
                                )
                              ),
                              DataCell(Row(
                                children: [
                                  TextButton.icon(
                                    onPressed: () => _toggleStatus(e['id'], e['status']),
                                    icon: Icon(isActive ? Icons.block : Icons.check_circle_outline, size: 18),
                                    label: Text(isActive ? "Suspend" : "Activate"),
                                    style: TextButton.styleFrom(
                                      foregroundColor: isActive ? Colors.orangeAccent : Colors.greenAccent,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  IconButton(
                                    icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
                                    tooltip: "Delete Employee",
                                    onPressed: () {
                                      showDialog(context: context, builder: (ctx) => AlertDialog(
                                        backgroundColor: surfaceColor,
                                        title: const Text("Delete Employee?"),
                                        content: Text("Are you sure you want to remove ${e['name']}?"),
                                        actions: [
                                          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text("Cancel", style: TextStyle(color: textSecondary))),
                                          ElevatedButton(
                                            onPressed: () {
                                              Navigator.pop(ctx);
                                              _deleteEmployee(e['id']);
                                            },
                                            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
                                            child: const Text("Delete"),
                                          )
                                        ],
                                      ));
                                    },
                                  ),
                                ],
                              )),
                            ]);
                          }).toList(),
                        ),
                      ),
                    ),
                  ),
                )
              ],
            ),
          )
        ],
      ),
    );
  }
}