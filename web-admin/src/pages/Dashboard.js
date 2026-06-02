import { useEffect, useState, useRef, useMemo } from "react";
import api from "../api";
import OTSettings from "./OTSettings";
import InsightCard from "../components/InsightCard";
import AnimatedStat from "../components/AnimatedStat";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line
} from 'recharts';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Download, 
  UserPlus, 
  LogOut, 
  Sun, 
  Moon, 
  RefreshCw, 
  MapPin, 
  Trash2,
  Power,
  Search,
  LayoutDashboard,
  Bell,
  CalendarDays,
  Check,
  X,
  Headset,
  Ticket,
  FileText,
  BrainCircuit,
  TrendingUp,
  Activity,
  Bot,
  Send,
  Zap,
  Megaphone,
  CalendarRange,
  Coffee,
  Lightbulb,
  AlertTriangle,
  Target,
  ShieldAlert,
  Award,
  Server,
  Globe,
  Play,
  Edit2,
  Settings,
  BellRing,
  Mail,
  Smartphone,
  Globe2,
  Monitor,
  Layout,
  Receipt,
  Key,
  Sparkles
} from 'lucide-react';
import ParallaxBlobs from "../components/ParallaxBlobs";
import ThemeToggle from "../components/ThemeToggle";
import AnimatedHero from "../components/AnimatedHero";

export default function Dashboard({ theme, onToggleTheme, animationsEnabled, onToggleAnimations }) {
  const [activeNav, setActiveNav] = useState("overview"); // 'overview', 'attendance', 'leaves', 'helpdesk', 'employees', 'settings', 'ot_settings', 'ai_insights'
  const [loading, setLoading] = useState(false);
  
  // Data State
  const [rows, setRows] = useState([]);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [stats, setStats] = useState({ total: 0, present: 0, late: 0, absent: 0, companyName: "Loading...", companyCode: "", adminName: "Admin" });
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [tickets, setTickets] = useState([
    { id: 'TKT-001', employee: 'Amit S.', issue: 'VPN Access Issue - Frequent Disconnects', status: 'OPEN', priority: 'HIGH', date: '2024-10-25' },
    { id: 'TKT-002', employee: 'Priya M.', issue: 'Leave Balance Query Check', status: 'RESOLVED', priority: 'LOW', date: '2024-10-24' },
    { id: 'TKT-003', employee: 'Ravi K.', issue: 'New Monitor Request for Design Work', status: 'IN_PROGRESS', priority: 'MEDIUM', date: '2024-10-26' },
  ]);
  
  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddEmpModalOpen, setIsAddEmpModalOpen] = useState(false);
  const [newEmp, setNewEmp] = useState({ empCode: "", name: "", password: "", designation: "" });
  const [addedEmpDetails, setAddedEmpDetails] = useState(null);
  const [selectedEmpInfo, setSelectedEmpInfo] = useState(null);
  const [isEditCompanyModalOpen, setIsEditCompanyModalOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notices, setNotices] = useState([]);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [newNotice, setNewNotice] = useState({ type: "System Update", title: "", message: "" });

  // Payslips State
  const [payslips, setPayslips] = useState([]);
  const [isUploadSlipModalOpen, setIsUploadSlipModalOpen] = useState(false);
  const [uploadSlipForm, setUploadSlipForm] = useState({ employee_id: "", month: "January", year: "2024", file: null });

  // Settings State
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [dailyReport, setDailyReport] = useState(false);
  const [accentColor, setAccentColor] = useState(localStorage.getItem('accentColor') || '#6366f1');
  const [compactMode, setCompactMode] = useState(false);
  const [language, setLanguage] = useState("English (US)");
  const [liveTime, setLiveTime] = useState(new Date());
  const [standardWorkHours, setStandardWorkHours] = useState(9);
  const [enableOT, setEnableOT] = useState(true);

  useEffect(() => {
    document.documentElement.style.setProperty('--primary', accentColor);
    localStorage.setItem('accentColor', accentColor);
  }, [accentColor]);

  // AI Copilot State
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotMessages, setCopilotMessages] = useState([
    { role: 'ai', text: "Namaste! Main aapka Smart AI Assistant hoon. Bina kisi setup ke aap mujhe commands de sakte hain jaise: 'Approve leaves', 'Download report', 'Dark theme' ya 'Add new employee'.", time: new Date().toISOString() }
  ]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Real-time Clock Ticker
  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Reset search query when switching tabs
  useEffect(() => {
    setSearchQuery("");
  }, [activeNav]);

  useEffect(() => {
    scrollToBottom();
  }, [copilotMessages, isCopilotOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [attRes, statsRes, empRes, leavesRes, payslipsRes, noticesRes] = await Promise.all([
        api.get("/attendance/today").catch(() => ({ data: [] })),
        api.get("/attendance/stats/today").catch(() => ({ data: { total: 0, present: 0, late: 0, absent: 0, companyName: "Error Loading", companyCode: "", adminName: "Admin" } })),
        api.get("/employees").catch(() => ({ data: [] })),
        api.get("/leaves").catch(() => ({ data: [] })),
        api.get("/payslips").catch(() => ({ data: [] })),
        api.get("/notices").catch(() => ({ data: [] }))
      ]);
      setRows(attRes.data);
      setStats(statsRes.data);
      setEmployees(empRes.data);
      setLeaves(leavesRes.data || []);
      setPayslips(payslipsRes.data || []);
      setNotices(noticesRes.data || []);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    loadData();
  }, [month]);

  const formatMins = (mins) => {
    if (!mins) return "-";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const downloadCsv = async () => {
    const res = await api.get(`/attendance/report/monthly?month=${month}`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_report_${month}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (!window.confirm(`Are you sure you want to ${newStatus === 'INACTIVE' ? 'suspend' : 'activate'} this employee?`)) return;
    try {
      await api.put(`/employees/${id}/status`, { status: newStatus });
      loadData();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (!window.confirm("Are you sure you want to PERMANENTLY delete this employee? This action cannot be undone.")) return;
    try {
      await api.delete(`/employees/${id}`);
      loadData();
    } catch (err) {
      alert("Failed to delete employee");
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/employees", newEmp);
      setAddedEmpDetails({
        empCode: data.empCode || newEmp.empCode,
        name: data.name || newEmp.name,
        designation: data.designation || newEmp.designation,
        password: data.password || newEmp.password
      });
      setNewEmp({ empCode: "", name: "", password: "", designation: "" });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add employee");
    }
  };

  const handleGenerateBulkEmployees = async () => {
    if (!window.confirm("Are you sure you want to generate 100 fake employees for testing?")) return;
    setLoading(true);
    try {
      const res = await api.post("/employees/generate-bulk");
      alert(res.data.message);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to generate bulk employees");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCompanyName = async (e) => {
    e.preventDefault();
    try {
      await api.put("/employees/company", { companyName: newCompanyName });
      setIsEditCompanyModalOpen(false);
      loadData();
      alert("Company name updated successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update company name");
    }
  };

  const handleGenerateFakeData = async () => {
    if (!window.confirm("Are you sure? This will generate 15 days of fake attendance data for all current employees in your workspace.")) return;
    try {
      const res = await api.post("/attendance/generate-fake-data");
      alert(res.data.message);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to generate data");
    }
  };

  const handlePublishNotice = async (e) => {
    e.preventDefault();
    try {
      await api.post("/notices", newNotice);
      setNewNotice({ type: "System Update", title: "", message: "" });
      setIsNoticeModalOpen(false);
      loadData(); // Reload data to show the new notice
    } catch (err) {
      alert(err.response?.data?.message || "Failed to publish notice");
    }
  };

  const handleDeleteNotice = async (id) => {
    if (!window.confirm("Are you sure you want to delete this notice?")) return;
    try {
      await api.delete(`/notices/${id}`);
      loadData(); // Reload to reflect deletion
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete notice");
    }
  };

  const handleLeaveAction = async (id, status) => {
    if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} this leave request?`)) return;
    try {
      await api.put(`/leaves/${id}/status`, { status });
      loadData();
    } catch (err) {
      alert("Failed to update leave status");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/";
  };

  const handleCopilotSubmit = async (e) => {
    e.preventDefault();
    if (!copilotInput.trim()) return;

    const userText = copilotInput.trim();
    setCopilotMessages(prev => [...prev, { role: 'user', text: userText, time: new Date().toISOString() }]);
    setCopilotInput("");

    // Add "Thinking..." placeholder
    setCopilotMessages(prev => [...prev, { role: 'ai', text: "Thinking...", time: new Date().toISOString(), typing: true }]);

    // First attempt to handle recognized commands locally for instant actions
    const lower = userText.toLowerCase();
    const localHandled = (() => {
      if (lower.includes("approve") || lower.includes("chutti") || lower.includes("leave")) {
        (async () => {
          const pending = leaves.filter(l => l.status === 'PENDING');
          if (pending.length > 0) {
            for (let l of pending) {
              await api.put(`/leaves/${l.id}/status`, { status: 'APPROVED' });
            }
            await loadData();
            setCopilotMessages(prev => {
              const newArr = [...prev];
              newArr[newArr.length - 1] = { role: 'ai', text: `Done! ✅ Maine ${pending.length} pending leaves ko approve kar diya hai.`, time: new Date().toISOString() };
              return newArr;
            });
            setActiveNav('leaves');
          } else {
            setCopilotMessages(prev => {
              const newArr = [...prev];
              newArr[newArr.length - 1] = { role: 'ai', text: "Currently, there are no pending leave requests to approve.", time: new Date().toISOString() };
              return newArr;
            });
          }
        })();
        return true;
      }

      if (lower.includes("late") || lower.includes("der")) {
        setActiveNav('attendance');
        setSearchQuery("LATE");
        setCopilotMessages(prev => {
          const newArr = [...prev];
          newArr[newArr.length - 1] = { role: 'ai', text: "Here you go! Maine list filter kar di hai for employees who are late today. ⏰", time: new Date().toISOString() };
          return newArr;
        });
        return true;
      }

      if (lower.includes("export") || lower.includes("csv") || lower.includes("download") || lower.includes("report")) {
        downloadCsv();
        setCopilotMessages(prev => {
          const newArr = [...prev];
          newArr[newArr.length - 1] = { role: 'ai', text: "Report generate ho rahi hai. Your download will start automatically. 📊", time: new Date().toISOString() };
          return newArr;
        });
        return true;
      }

      if (lower.includes("add") || lower.includes("new employee") || lower.includes("naya") || lower.includes("onboard")) {
        setActiveNav('employees');
        setIsAddEmpModalOpen(true);
        setCopilotMessages(prev => {
          const newArr = [...prev];
          newArr[newArr.length - 1] = { role: 'ai', text: "Maine 'New Employee' form open kar diya hai. Kripya naye saathi ki details yahan bharein. 👤+", time: new Date().toISOString() };
          return newArr;
        });
        return true;
      }

      if (lower.includes("ticket") || lower.includes("helpdesk") || lower.includes("support") || lower.includes("issue")) {
        setActiveNav('helpdesk');
        setCopilotMessages(prev => {
          const newArr = [...prev];
          newArr[newArr.length - 1] = { role: 'ai', text: "Main aapko Helpdesk portal par le chalta hoon. 🛠️", time: new Date().toISOString() };
          return newArr;
        });
        return true;
      }

      if (lower.includes("dark") || lower.includes("light") || lower.includes("theme")) {
        onToggleTheme();
        setCopilotMessages(prev => {
          const newArr = [...prev];
          newArr[newArr.length - 1] = { role: 'ai', text: "Theme change kar diya gaya hai! 🎨 Kaisa lag raha hai?", time: new Date().toISOString() };
          return newArr;
        });
        return true;
      }

      if (lower.includes("employee") || lower.includes("team") || lower.includes("staff")) {
        setActiveNav('employees');
        setCopilotMessages(prev => {
          const newArr = [...prev];
          newArr[newArr.length - 1] = { role: 'ai', text: "Employee directory khol di hai. 👥", time: new Date().toISOString() };
          return newArr;
        });
        return true;
      }

      if (lower.includes("hello") || lower.includes("hi") || lower.includes("namaste") || lower.includes("hey")) {
        setCopilotMessages(prev => {
          const newArr = [...prev];
          newArr[newArr.length - 1] = { role: 'ai', text: `Namaste ${stats.adminName}! 🌟 Main aapka Pulse AI Copilot hoon. Main aapke daily HR tasks ko automate aur track kar sakta hoon. How can I assist you today?`, time: new Date().toISOString() };
          return newArr;
        });
        return true;
      }

      if (lower.includes("stats") || lower.includes("present") || lower.includes("absent") || lower.includes("today")) {
        setCopilotMessages(prev => {
          const newArr = [...prev];
          newArr[newArr.length - 1] = { role: 'ai', text: `Aaj ka status: \\n+✅ ${stats.present} Present\\n⏰ ${stats.late} Late\\n❌ ${stats.absent} Absent\\nTotal Workforce: ${stats.total} employees.`, time: new Date().toISOString() };
          return newArr;
        });
        return true;
      }

      if (lower.includes("fake") || lower.includes("generate data") || lower.includes("mock data")) {
        setCopilotMessages(prev => {
          const newArr = [...prev];
          newArr[newArr.length - 1] = { role: 'ai', text: "Generating fake data... 🔄 Please check your dashboard in a moment. Note: Data will be generated only for existing active employees.", time: new Date().toISOString() };
          return newArr;
        });
        handleGenerateFakeData();
        return true;
      }

      if (lower.includes("company name") || lower.includes("change name")) {
        setIsEditCompanyModalOpen(true);
        setCopilotMessages(prev => {
          const newArr = [...prev];
          newArr[newArr.length - 1] = { role: 'ai', text: "Sure! Maine 'Company Info' edit modal open kar diya hai. 🏢", time: new Date().toISOString() };
          return newArr;
        });
        return true;
      }

      if (lower.includes("ot") || lower.includes("overtime")) {
        setActiveNav('ot_settings');
        setCopilotMessages(prev => {
          const newArr = [...prev];
          newArr[newArr.length - 1] = { role: 'ai', text: "Maine Overtime (OT) Settings page open kar diya hai. Yahan aap standard work hours aur OT rules configure kar sakte hain. ⏱️", time: new Date().toISOString() };
          return newArr;
        });
        return true;
      }

      return false;
    })();

    if (localHandled) return;

    // Otherwise forward to backend AI service
    try {
      const toSend = [...copilotMessages.map(m => ({ role: m.role, text: m.text })), { role: 'user', text: userText }];
      const resp = await api.post('/ai/chat', { messages: toSend });
      const aiText = resp.data && resp.data.text ? resp.data.text : 'Sorry, I could not reach the AI service.';
      setCopilotMessages(prev => {
        const newArr = [...prev];
        newArr[newArr.length - 1] = { role: 'ai', text: aiText, time: new Date().toISOString() };
        return newArr;
      });
    } catch (err) {
      setCopilotMessages(prev => {
        const newArr = [...prev];
        newArr[newArr.length - 1] = { role: 'ai', text: 'AI service error. Try again later.', time: new Date().toISOString() };
        return newArr;
      });
      console.error('AI chat error', err);
    }
  };

  const getStatusBadge = (status) => {
    if (status === "PRESENT" || status === "ACTIVE" || status === "APPROVED") return <span className="badge badge-success"><CheckCircle2 size={14} /> {status}</span>;
    if (status === "LATE" || status === "PENDING") return <span className="badge badge-warning"><AlertCircle size={14} /> {status}</span>;
    return <span className="badge badge-danger"><XCircle size={14} /> {status}</span>;
  };

  // Filtered Data based on Search
  const filterBySearch = (arr, query) => {
    if (!query.trim()) return arr;
    const lowerQuery = query.toLowerCase().trim();
    return arr.filter(item => 
      (item.name && item.name.toLowerCase().includes(lowerQuery)) || 
      (item.emp_code && item.emp_code.toLowerCase().includes(lowerQuery)) ||
      (item.department && item.department.toLowerCase().includes(lowerQuery)) ||
      (item.status && item.status.toLowerCase().includes(lowerQuery)) ||
      (item.employee && item.employee.toLowerCase().includes(lowerQuery)) ||
      (item.issue && item.issue.toLowerCase().includes(lowerQuery)) ||
      (item.id && item.toLowerCase().includes(lowerQuery))
    );
  };

  // USE-MEMO: Yeh aapki website ko 10x fast kar dega jab aap search karenge (No lag!)
  const filteredRows = useMemo(() => filterBySearch(rows, searchQuery), [rows, searchQuery]);
  const filteredEmployees = useMemo(() => filterBySearch(employees, searchQuery), [employees, searchQuery]);
  const filteredLeaves = useMemo(() => filterBySearch(leaves, searchQuery), [leaves, searchQuery]);
  const filteredTickets = useMemo(() => filterBySearch(tickets, searchQuery), [tickets, searchQuery]);

  // Chart Data
  const chartData = [
    { name: 'Present', value: stats.present, color: '#10b981' },
    { name: 'Late', value: stats.late, color: '#f59e0b' },
    { name: 'Absent', value: stats.absent, color: '#ef4444' }
  ].filter(d => d.value > 0);

  // Mock AI Data for Advanced Features
  const aiTrendData = [
    { day: 'Mon', productivity: 85, burnout_risk: 20 },
    { day: 'Tue', productivity: 88, burnout_risk: 25 },
    { day: 'Wed', productivity: 92, burnout_risk: 30 },
    { day: 'Thu', productivity: 80, burnout_risk: 45 },
    { day: 'Fri', productivity: 75, burnout_risk: 60 },
  ];
  
  // New Advanced AI Mock Data
  const deptHealthData = [
    { subject: 'Engineering', score: 85, fullMark: 100 },
    { subject: 'Marketing', score: 92, fullMark: 100 },
    { subject: 'Sales', score: 78, fullMark: 100 },
    { subject: 'HR', score: 95, fullMark: 100 },
    { subject: 'Support', score: 65, fullMark: 100 },
  ];

  const anomalyData = [
    { time: '08:00', usual: 50, today: 48 },
    { time: '08:30', usual: 80, today: 75 },
    { time: '09:00', usual: 120, today: 185 }, // Sudden Spike Anomaly
    { time: '09:30', usual: 150, today: 190 },
    { time: '10:00', usual: 160, today: 195 },
  ];

  // Dynamic Greeting Logic
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good Morning" : currentHour < 18 ? "Good Afternoon" : "Good Evening";

  // Advanced Bento Box Widgets Mock Data
  // DYNAMIC TOP PERFORMER: Calculates the earliest check-in of the day automatically
  const topPerformer = useMemo(() => {
    const presentEmps = rows.filter(r => r.status === 'PRESENT' && r.check_in);
    if (presentEmps.length === 0) return { name: "Awaiting Data", role: "-", score: "0%", avatar: "-" };
    
    presentEmps.sort((a, b) => new Date(a.check_in) - new Date(b.check_in));
    const best = presentEmps[0];
    return {
      name: best.name.split(' ')[0],
      role: best.department || "Early Bird",
      score: "100%",
      avatar: best.name.charAt(0).toUpperCase()
    };
  }, [rows]);

  const systemHealth = { uptime: "99.99%", latency: "24ms", load: "12%" };
  const worldClocks = [
    { city: 'IND', time: liveTime.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute:'2-digit' }) },
    { city: 'NY', time: liveTime.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute:'2-digit' }) },
    { city: 'LON', time: liveTime.toLocaleTimeString('en-US', { timeZone: 'Europe/London', hour: '2-digit', minute:'2-digit' }) }
  ];

  const bentoCardStyle = { background: 'var(--bg-card)', borderRadius: 32, padding: 32, border: '1px solid var(--border)', boxShadow: '0 20px 40px -20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', transition: 'all 0.3s', backdropFilter: 'blur(20px)' };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <div className="brand">
          <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, var(--primary), #a855f7)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 8px 16px -4px var(--primary)' }}>
            <Activity size={20} />
          </div>
          <span style={{ fontWeight: 900, letterSpacing: '-0.5px' }}>PulseHR</span>
        </div>

        <nav className="nav-menu" style={{ flex: 1, overflowY: 'auto' }}>
          <button className={`nav-item ${activeNav === 'overview' ? 'active' : ''}`} onClick={() => setActiveNav('overview')}>
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button className={`nav-item ${activeNav === 'ai_insights' ? 'active' : ''}`} onClick={() => setActiveNav('ai_insights')}>
            <BrainCircuit size={20} /> AI Insights <span style={{fontSize: 10, background: '#a855f7', color: '#fff', padding: '2px 6px', borderRadius: 4, marginLeft: 'auto'}}>NEW</span>
          </button>
          <button className={`nav-item ${activeNav === 'attendance' ? 'active' : ''}`} onClick={() => setActiveNav('attendance')}>
            <Clock size={20} /> Attendance Logs
          </button>
          <button className={`nav-item ${activeNav === 'leaves' ? 'active' : ''}`} onClick={() => setActiveNav('leaves')}>
            <CalendarDays size={20} /> Leave Requests
          </button>
          <button className={`nav-item ${activeNav === 'payslips' ? 'active' : ''}`} onClick={() => setActiveNav('payslips')}>
            <Receipt size={20} /> Payroll & Payslips
          </button>
          <button className={`nav-item ${activeNav === 'helpdesk' ? 'active' : ''}`} onClick={() => setActiveNav('helpdesk')}>
            <Headset size={20} /> Support Helpdesk
          </button>
          <button className={`nav-item ${activeNav === 'employees' ? 'active' : ''}`} onClick={() => setActiveNav('employees')}>
            <Users size={20} /> Employee Directory
          </button>
          <button className={`nav-item ${activeNav === 'settings' ? 'active' : ''}`} onClick={() => setActiveNav('settings')}>
            <Settings size={20} /> Settings & Preferences
          </button>
          <button className={`nav-item ${activeNav === 'ot_settings' ? 'active' : ''}`} onClick={() => setActiveNav('ot_settings')}>
            <Zap size={20} /> Overtime Settings
          </button>
        </nav>

        <div className="sidebar-footer" style={{ marginTop: 'auto' }}>
          <button className="nav-item" onClick={onToggleTheme}>
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />} 
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
          <button className="nav-item" onClick={logout} style={{ color: 'var(--danger)' }}>
            <LogOut size={20} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        
        {/* Topbar */}
        <header className="topbar">
          <div className="search-box">
            <Search size={18} color="var(--text-muted)" />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search employees by name or code..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="user-profile">
            <button className="btn btn-secondary" style={{ padding: 10, borderRadius: 4 }} onClick={loadData}>
              <RefreshCw size={18} className={loading ? "spin" : ""} />
            </button>
            <button className="btn btn-secondary" title={animationsEnabled ? 'Disable animations' : 'Enable animations'} onClick={onToggleAnimations} style={{ marginLeft: 8, padding: 10, borderRadius: 8 }}>
              <Sparkles size={16} color={animationsEnabled ? 'var(--primary)' : 'var(--text-muted)'} />
            </button>
            <div style={{ position: 'relative' }}>
              <div style={{ width: 44, height: 44, borderRadius: 16, background: 'var(--bg-input)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', cursor: 'pointer' }} onClick={() => setShowNotifications(!showNotifications)}>
                <Bell size={20} />
              </div>
              {showNotifications && (
                <div style={{ position: 'absolute', top: 54, right: 0, width: 300, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 4, boxShadow: 'var(--shadow-sm)', zIndex: 100, padding: 16 }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 700 }}>Notifications</h4>
                  <div style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 4, fontSize: 14, color: 'var(--text-muted)' }}>
                    No new notifications right now.
                  </div>
                </div>
              )}
              {/* BENTO 7: Notice Board (Span 4) */}
            </div>
            <div className="avatar" style={{ borderRadius: 16, background: 'linear-gradient(135deg, var(--primary), #a855f7)', color: '#fff' }}>{stats.adminName.charAt(0).toUpperCase()}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, textTransform: 'capitalize' }}>{stats.adminName}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              {stats.companyName} {stats.companyCode ? `(${stats.companyCode})` : ""}
                <button style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, display: 'flex' }} onClick={() => { setNewCompanyName(stats.companyName); setIsEditCompanyModalOpen(true); }} title="Edit Company Name">
                  <Edit2 size={12} />
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 12 }}>
              <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="page-container">
          <ParallaxBlobs animate={animationsEnabled} />
          
          {/* --- OVERVIEW TAB --- */}
          {activeNav === "overview" && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 24, marginBottom: 40 }}>
                
                {/* BENTO 1: Hero Welcome & Mini Stats (Span 8) */}
                <div className="fade-in-up stagger-1 hover-lift" style={{ ...bentoCardStyle, gridColumn: 'span 8' }}>
                  <div className="float-blob glow-breathe" style={{ position: 'absolute', top: '-50%', right: '-10%', width: '400px', height: '400px', background: 'var(--primary)', filter: 'blur(120px)', opacity: 0.15, borderRadius: '50%', zIndex: 0 }}></div>
                  <div className="float-blob glow-breathe" style={{ position: 'absolute', bottom: '-20%', right: '20%', width: '300px', height: '300px', background: '#a855f7', filter: 'blur(100px)', opacity: 0.15, borderRadius: '50%', zIndex: 0, animationDelay: '2s' }}></div>
                  
                  <AnimatedHero greeting={greeting} name={stats.adminName} company={`${stats.companyName} ${stats.companyCode ? `(${stats.companyCode})` : ''}`} stats={stats} />
                  
                  <div className="fade-in-up stagger-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 'auto', position: 'relative', zIndex: 1 }}>
                    <div className="hover-lift" style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', padding: 20, borderRadius: 20 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)' }}>Total</div>
                      <div style={{ fontSize: 32, fontWeight: 900, marginTop: 4, color: 'var(--text-main)' }}>{stats.total}</div>
                    </div>
                    <div className="hover-lift" style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', borderTop: '4px solid var(--success)', padding: 20, borderRadius: 20 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)' }}>Present</div>
                      <div style={{ fontSize: 32, fontWeight: 900, marginTop: 4, color: 'var(--text-main)' }}>{stats.present}</div>
                    </div>
                    <div className="hover-lift" style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', borderTop: '4px solid var(--warning)', padding: 20, borderRadius: 20 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)' }}>Late</div>
                      <div style={{ fontSize: 32, fontWeight: 900, marginTop: 4, color: 'var(--text-main)' }}>{stats.late}</div>
                    </div>
                    <div className="hover-lift" style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', borderTop: '4px solid var(--danger)', padding: 20, borderRadius: 20 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)' }}>Absent</div>
                      <div style={{ fontSize: 32, fontWeight: 900, marginTop: 4, color: 'var(--text-main)' }}>{stats.absent}</div>
                    </div>
                  </div>
                </div>

                {/* BENTO 2: Top Performer Gamification (Span 4) */}
                <div className="fade-in-up stagger-2 hover-lift" style={{ ...bentoCardStyle, gridColumn: 'span 4', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  <div style={{ position: 'absolute', top: 20, left: 20 }}><Award size={24} color="var(--warning)" /></div>
                  <div style={{ width: 88, height: 88, borderRadius: 28, background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 900, marginBottom: 16, boxShadow: '0 12px 24px -8px var(--primary)' }}>
                    {topPerformer.avatar}
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-main)' }}>{topPerformer.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 600 }}>{topPerformer.role}</p>
                  <div style={{ marginTop: 24, background: 'var(--bg-input)', padding: '10px 20px', borderRadius: 50, color: 'var(--success)', fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TrendingUp size={18} /> {topPerformer.score} Efficiency
                  </div>
                </div>

                {/* BENTO 3: System Telemetry (Span 4) */}
                <div className="fade-in-up stagger-3 hover-lift" style={{ ...bentoCardStyle, gridColumn: 'span 4' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}><Server size={18} color="var(--primary)"/> System Telemetry</h3>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: 'var(--success)', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: 4 }}><div className="pulse-fast" style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--success)' }}></div> ONLINE</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>API Latency</span><span style={{ fontWeight: 800, fontSize: 16 }}>{systemHealth.latency}</span></div>
                    <div style={{ width: '100%', height: 4, background: 'var(--bg-input)', borderRadius: 2 }}><div style={{ width: '15%', height: '100%', background: 'var(--success)', borderRadius: 2 }}></div></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Server Load</span><span style={{ fontWeight: 800, fontSize: 16 }}>{systemHealth.load}</span></div>
                    <div style={{ width: '100%', height: 4, background: 'var(--bg-input)', borderRadius: 2 }}><div style={{ width: '25%', height: '100%', background: 'var(--warning)', borderRadius: 2 }}></div></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Uptime SLA</span><span style={{ fontWeight: 800, fontSize: 16, color: 'var(--primary)' }}>{systemHealth.uptime}</span></div>
                  </div>
                </div>

                {/* BENTO 4: Quick Launchpad (Span 4) */}
                <div className="fade-in-up stagger-4 hover-lift" style={{ ...bentoCardStyle, gridColumn: 'span 4', background: 'var(--bg-hover)' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}><Zap size={18} color="var(--warning)"/> Quick Launchpad</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <button className="hover-grow" style={{ padding: 16, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => {setActiveNav('employees'); setIsAddEmpModalOpen(true);}}>
                      <UserPlus size={24} color="var(--primary)" />
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)' }}>Onboard</span>
                    </button>
                    <button className="hover-grow" style={{ padding: 16, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => setActiveNav('helpdesk')}>
                      <Headset size={24} color="var(--success)" />
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)' }}>Support</span>
                    </button>
                    <button className="hover-grow hover-glow" style={{ padding: 16, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', gridColumn: 'span 2' }} onClick={downloadCsv}>
                      <Download size={24} color="var(--warning)" />
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)' }}>Export Global Report</span>
                    </button>
                  </div>
                </div>

                {/* BENTO 5: World Clocks (Span 4) */}
                <div className="fade-in-up stagger-5 hover-lift" style={{ ...bentoCardStyle, gridColumn: 'span 4', background: 'linear-gradient(135deg, var(--primary), var(--bg-hover))' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}><Globe size={18} color="#a855f7"/> World Clocks</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {worldClocks.map((clock, idx) => (
                      <div key={idx} className="hover-grow" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, background: 'var(--bg-input)', borderRadius: 16 }}>
                        <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-muted)' }}>{clock.city}</span>
                        <span style={{ fontWeight: 900, fontSize: 22, color: 'var(--text-main)', letterSpacing: -1 }}>{clock.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* BENTO 6: Live Check-ins (Span 8) */}
                <div className="fade-in-up stagger-6 hover-lift" style={{ ...bentoCardStyle, gridColumn: 'span 8', padding: 0 }}>
                  <div className="table-toolbar">
                    <h3 style={{ fontSize: 18, fontWeight: 700 }}>Live Check-ins</h3>
                    <button className="btn btn-secondary hover-grow" onClick={() => setActiveNav('attendance')}>View Detailed Logs</button>
                  </div>
                  <table style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Time In</th>
                        <th>Current Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.slice(0, 5).map(r => (
                        <tr key={r.id} className="hover-lift">
                          <td>
                            <div style={{ fontWeight: 600, fontSize: 16 }}>{r.name}</div>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{r.emp_code}</div>
                          </td>
                          <td>{r.check_in ? new Date(r.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}</td>
                          <td>{getStatusBadge(r.status)}</td>
                        </tr>
                      ))}
                      {filteredRows.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No records generated yet.</td></tr>}
                    </tbody>
                  </table>
                </div>

                {/* BENTO 7: Notice Board (Span 4) */}
                <div className="fade-in-up stagger-7 hover-lift" style={{ ...bentoCardStyle, gridColumn: 'span 4' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><Megaphone size={20} color="var(--primary)"/> Notice Board</h3>
                    <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => setIsNoticeModalOpen(true)}>Edit</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 250, overflowY: 'auto', paddingRight: 8 }}>
                    {notices.length > 0 ? notices.map(notice => (
                      <div key={notice.id} style={{ padding: 16, background: 'var(--bg-input)', borderRadius: 16, borderLeft: `4px solid ${notice.type === 'Upcoming Holiday' ? 'var(--warning)' : 'var(--primary)'}`, position: 'relative' }}>
                        <button 
                          onClick={() => handleDeleteNotice(notice.id)}
                          style={{ position: 'absolute', top: 8, right: 8, background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, zIndex: 1 }}
                          title="Delete Notice"
                        >
                          <Trash2 size={14} />
                        </button>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{notice.type}</div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-main)', paddingRight: 20 }}>{notice.title}</div>
                        {notice.message && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5, paddingRight: 20 }}>{notice.message}</p>}
                      </div>
                    )) : <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>No notices published yet.</div>}
                  </div>
                </div>
              </div>

              {/* --- Quick Insights Row (New Feature) --- */}
              <div className="fade-in-up stagger-7" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 12, marginBottom: 40 }}>
                <InsightCard title="Avg Check-in" subtitle="Last 7 days" value={rows.length ? (Math.round((rows.reduce((s, r) => s + (r.check_in ? 1 : 0), 0) / Math.max(rows.length,1)) * 100) + '%') : '—'} change={3} data={[60,62,58,65,70,68,72]} color="#06b6d4" icon={<Clock size={18} />} />
                <InsightCard title="Overtime Today" subtitle="Minutes" value={stats.overtime_minutes || '0'} change={-8} data={[5,10,0,20,35,25,18]} color="#f59e0b" icon={<Zap size={18} />} />
                <InsightCard title="Engagement" subtitle="Team Sentiment" value={Math.round((Math.random()*20)+80) + '%'} change={2} data={[82,85,84,88,90,89,91]} color="#10b981" icon={<Sparkles size={18} />} />
              </div>
            </>
          )}

          {/* --- AI INSIGHTS TAB (NEW ADVANCED FEATURE) --- */}
          {activeNav === "ai_insights" && (
            <>
              <div className="page-header">
                <div>
                  <h1 className="page-title">Pulse AI Insights</h1>
                  <p style={{ color: 'var(--text-muted)', fontSize: 16, marginTop: 4, fontWeight: 500 }}>Predictive Analytics & Team Health</p>
                </div>
              </div>

              {/* Redesigned AI Insights Dashboard Layout */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginBottom: 24 }}>
                {/* Priority Alert Box */}
                <div className="card card-entrance" style={{ gridColumn: 'span 2', background: 'linear-gradient(135deg, var(--primary), rgba(245, 158, 11, 0.1))', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ background: 'var(--danger)', padding: 12, borderRadius: 4, color: '#fff', boxShadow: 'var(--shadow-sm)' }}><ShieldAlert size={24}/></div>
                      <h3 style={{ fontSize: 22, fontWeight: 800 }}>Critical Anomalies Detected</h3>
                    </div>
                    <span style={{ background: 'var(--danger)', color: '#fff', padding: '4px 12px', borderRadius: 4, fontSize: 12, fontWeight: 800 }}>2 ALERTS</span>
                  </div>
                  <p style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--text-main)', marginBottom: 24 }}>
                    <span style={{ fontWeight: 800 }}>1.</span> Sudden 30% spike in check-ins around 09:00 AM today compared to the 30-day average. Possible biometric queue delay. <br/><br/>
                    <span style={{ fontWeight: 800 }}>2.</span> Support Team is showing <span style={{ color: 'var(--danger)', fontWeight: 800 }}>High Burnout Risk</span> (Score: 65/100).
                  </p>
                  <button className="btn" style={{ background: 'var(--danger)', color: '#fff', border: 'none' }}>Take Preventive Action</button>
                </div>

                {/* AI Action Plan */}
                <div className="card card-entrance" style={{ background: 'var(--bg-card)', border: '1px solid var(--primary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <Lightbulb size={24} color="var(--warning)" />
                    <h3 style={{ fontSize: 18, fontWeight: 800 }}>AI Action Plan</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: 12, background: 'var(--bg-input)', borderRadius: 4, cursor: 'pointer' }}>
                      <input type="checkbox" style={{ marginTop: 4, transform: 'scale(1.2)' }} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>Schedule 1-on-1 with Support Team Leads</span>
                    </label>
                    <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: 12, background: 'var(--bg-input)', borderRadius: 4, cursor: 'pointer' }}>
                      <input type="checkbox" style={{ marginTop: 4, transform: 'scale(1.2)' }} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>Review overtime compensation for Engineering</span>
                    </label>
                    <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: 12, background: 'var(--bg-input)', borderRadius: 4, cursor: 'pointer' }}>
                      <input type="checkbox" style={{ marginTop: 4, transform: 'scale(1.2)' }} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>Approve 3 bulk leave requests for Diwali</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="dashboard-grid">
                {/* New Feature: Anomaly Line Chart */}
                <div className="card card-entrance">
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}><Activity size={20} color="var(--primary)"/> Check-in Volume vs Usual</h3>
                  <div style={{ height: 280, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={anomalyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                        <RechartsTooltip contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: 4, boxShadow: 'var(--shadow-sm)' }} />
                        <Legend verticalAlign="top" height={36} iconType="circle" />
                        <Line type="monotone" dataKey="usual" name="30-Day Average" stroke="var(--text-muted)" strokeWidth={3} strokeDasharray="5 5" dot={false} />
                        <Line type="monotone" dataKey="today" name="Today's Live Data" stroke="var(--danger)" strokeWidth={4} activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* New Feature: Department Health Radar Chart */}
                <div className="card card-entrance">
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}><Target size={20} color="var(--success)"/> Department Health Index</h3>
                  <div style={{ height: 280, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={deptHealthData}>
                        <PolarGrid stroke="var(--border)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-main)', fontSize: 12, fontWeight: 600 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'var(--text-muted)' }} />
                        <Radar name="Health Score" dataKey="score" stroke="var(--success)" fill="var(--success)" fillOpacity={0.4} />
                        <RechartsTooltip contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: 4 }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Weekly Trend (Moved Down) */}
              <div className="card card-entrance" style={{ marginTop: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Weekly Productivity vs Burnout Trend</h3>
                <div style={{ height: 250, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={aiTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorBurn" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--danger)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" stroke="var(--text-muted)" />
                      <YAxis stroke="var(--text-muted)" />
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <RechartsTooltip contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: 4 }} />
                      <Area type="monotone" dataKey="productivity" stroke="var(--success)" strokeWidth={3} fillOpacity={1} fill="url(#colorProd)" />
                      <Area type="monotone" dataKey="burnout_risk" stroke="var(--danger)" strokeWidth={3} fillOpacity={1} fill="url(#colorBurn)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {/* --- ATTENDANCE TAB --- */}
          {activeNav === "attendance" && (
            <>
              <div className="page-header fade-in-down stagger-1">
                <div>
                  <h1 className="page-title">Attendance Logs</h1>
                  <p style={{ color: 'var(--text-muted)', fontSize: 16, marginTop: 4, fontWeight: 500 }}>Comprehensive daily tracking.</p>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button className="btn btn-secondary hover-lift" onClick={handleGenerateFakeData}>
                    <Zap size={18} color="var(--warning)" /> Generate Fake Data
                  </button>
                  <input className="form-control" style={{ width: 'auto' }} type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
                  <button className="btn hover-lift" style={{ background: '#0f172a' }} onClick={downloadCsv}>
                    <Download size={18} /> Export CSV
                  </button>
                </div>
              </div>

              <div className="table-wrapper fade-in-up stagger-2">
                <table>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Time Log</th>
                      <th>Geo-Location</th>
                      <th>Duration Log</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.length === 0 ? (
                      <tr><td colSpan="5" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>No records found matching your search.</td></tr>
                    ) : (
                      filteredRows.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: 16 }}>{r.name}</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: 4 }}>{r.emp_code}</div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', width: 28 }}>IN</span> 
                              <span style={{ fontWeight: 600 }}>{r.check_in ? new Date(r.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', width: 28 }}>OUT</span> 
                              <span style={{ fontWeight: 600 }}>{r.check_out ? new Date(r.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}</span>
                            </div>
                            {r.punches && r.punches.length > 2 && (
                              <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700, marginTop: 6, cursor: 'pointer' }}>
                                View All {r.punches.length} Punches
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--text-muted)' }}>
                              <MapPin size={14} color="var(--success)" /> 
                              <span style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.check_in_location || '-'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>
                              <MapPin size={14} color="var(--danger)" /> 
                              <span style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.check_out_location || '-'}</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, fontSize: 15 }}>{formatMins(r.total_minutes)}</div>
                            {r.overtime_minutes > 0 && (
                              <div style={{ fontSize: 13, color: 'var(--warning)', fontWeight: 700, marginTop: 4, display: 'inline-flex', padding: '2px 8px', background: 'var(--warning-bg)', borderRadius: 6 }}>
                                OT: {formatMins(r.overtime_minutes)}
                              </div>
                            )}
                          </td>
                          <td>{getStatusBadge(r.status)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* --- LEAVES TAB --- */}
          {activeNav === "leaves" && (
            <>
              <div className="page-header">
                <div>
                  <h1 className="page-title">Leave Approvals</h1>
                  <p style={{ color: 'var(--text-muted)', fontSize: 16, marginTop: 4, fontWeight: 500 }}>Manage time-off requests.</p>
                </div>
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Duration & Type</th>
                      <th>Reason Provided</th>
                      <th>Current Status</th>
                      <th>Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeaves.length === 0 ? (
                      <tr><td colSpan="5" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>No leave requests pending.</td></tr>
                    ) : (
                      filteredLeaves.map((l) => (
                        <tr key={l.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: 16 }}>{l.name}</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: 4 }}>{l.emp_code}</div>
                          </td>
                          <td>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>{new Date(l.start_date).toLocaleDateString()} to {new Date(l.end_date).toLocaleDateString()}</div>
                            <div style={{ fontSize: 13, color: 'var(--primary)', marginTop: 6, fontWeight: 700 }}>{l.leave_type}</div>
                          </td>
                          <td>
                            <div style={{ maxWidth: 350, whiteSpace: 'normal', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>{l.reason || 'No reason provided'}</div>
                          </td>
                          <td>{getStatusBadge(l.status)}</td>
                          <td>
                            {l.status === 'PENDING' ? (
                              <div style={{ display: 'flex', gap: 10 }}>
                                <button className="btn" style={{ padding: '8px 12px', background: 'var(--success)', boxShadow: 'var(--shadow-sm)' }} onClick={() => handleLeaveAction(l.id, 'APPROVED')}>
                                  <Check size={16} /> Approve
                                </button>
                                <button className="btn" style={{ padding: '8px 12px', background: 'var(--danger)', boxShadow: 'var(--shadow-sm)' }} onClick={() => handleLeaveAction(l.id, 'REJECTED')}>
                                  <X size={16} /> Reject
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '6px 12px', borderRadius: 8 }}>Processed</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* --- PAYSLIPS TAB --- */}
          {activeNav === "payslips" && (
            <>
              <div className="page-header">
                <div>
                  <h1 className="page-title">Payroll & Payslips</h1>
                  <p style={{ color: 'var(--text-muted)', fontSize: 16, marginTop: 4, fontWeight: 500 }}>Upload and manage employee salary slips.</p>
                </div>
                <button className="btn" onClick={() => setIsUploadSlipModalOpen(true)}>
                  <Receipt size={18} /> Upload Payslip
                </button>
              </div>
              
              <div className="card card-entrance table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Month</th>
                      <th>Year</th>
                      <th>Uploaded On</th>
                      <th>File</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payslips.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
                          No payslips uploaded yet.
                        </td>
                      </tr>
                    ) : (
                      payslips.map((slip) => (
                        <tr key={slip.id}>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{slip.employee_name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{slip.emp_code}</div>
                          </td>
                          <td>{slip.month}</td>
                          <td>{slip.year}</td>
                          <td>{new Date(slip.created_at).toLocaleDateString()}</td>
                          <td>
                            <a href={`http://localhost:5000${slip.file_path}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                              <FileText size={16} /> View
                            </a>
                          </td>
                          <td>
                            <button 
                              onClick={async () => {
                                if (window.confirm("Delete this payslip?")) {
                                  try {
                                    await api.delete(`/payslips/${slip.id}`);
                                    loadData();
                                  } catch (e) { alert("Delete failed"); }
                                }
                              }} 
                              style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '6px' }}
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* --- HELPDESK TAB --- */}
          {activeNav === "helpdesk" && (
            <>
              <div className="page-header">
                <div>
                  <h1 className="page-title">Support Helpdesk</h1>
                  <p style={{ color: 'var(--text-muted)', fontSize: 16, marginTop: 4, fontWeight: 500 }}>Manage employee IT & HR support tickets.</p>
                </div>
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Employee Info</th>
                      <th>Issue Description</th>
                      <th>Priority</th>
                      <th>Current Status</th>
                      <th className="action-header">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.length === 0 ? (
                      <tr><td colSpan="6" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>No active support tickets found.</td></tr>
                    ) : (
                      filteredTickets.map((t) => (
                        <tr key={t.id}>
                          <td data-label="Ticket ID">
                            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary)', background: 'var(--bg-hover)', padding: '6px 12px', borderRadius: 8 }}>{t.id}</span>
                          </td>
                          <td data-label="Employee Info"><div style={{ fontWeight: 700 }}>{t.employee}</div></td>
                          <td data-label="Issue Description" style={{ maxWidth: 250, whiteSpace: 'normal', lineHeight: 1.5 }}>{t.issue}</td>
                          <td data-label="Priority"><span style={{ fontWeight: 700, color: t.priority === 'HIGH' ? 'var(--danger)' : t.priority === 'MEDIUM' ? 'var(--warning)' : 'var(--success)' }}>{t.priority}</span></td>
                          <td data-label="Current Status"><span style={{ fontWeight: 600, fontSize: 12, padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border)' }}>{t.status}</span></td>
                          <td data-label="Action" className="action-cell">
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '8px 12px', opacity: t.status === 'RESOLVED' ? 0.5 : 1 }} 
                              onClick={() => {
                                setTickets(tickets.map(ticket => ticket.id === t.id ? { ...ticket, status: 'RESOLVED' } : ticket));
                                alert(`Ticket ${t.id} has been marked as resolved!`);
                              }}
                              disabled={t.status === 'RESOLVED'}
                            >
                              {t.status === 'RESOLVED' ? 'Resolved' : 'Reply & Resolve'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* --- EMPLOYEES TAB --- */}
          {activeNav === "employees" && (
            <>
              <div className="page-header">
                <div>
                  <h1 className="page-title">Employee Directory</h1>
                  <p style={{ color: 'var(--text-muted)', fontSize: 16, marginTop: 4, fontWeight: 500 }}>Manage workforce access.</p>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button className="btn btn-secondary" style={{ padding: '14px 24px', fontSize: 16 }} onClick={handleGenerateBulkEmployees} disabled={loading}>
                    <Users size={20} /> Generate 100 Employees
                  </button>
                  <button className="btn" style={{ padding: '14px 24px', fontSize: 16 }} onClick={() => setIsAddEmpModalOpen(true)}>
                    <UserPlus size={20} /> Onboard New Employee
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
                {filteredEmployees.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: 4, border: '1px dashed var(--border)' }}>
                    No personnel records found.
                  </div>
                ) : (
                  filteredEmployees.map((e) => {
                    const isActive = e.status === 'ACTIVE';
                    const joined = new Date(e.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                    return (
                      <div key={e.id} className="employee-card" onClick={() => setSelectedEmpInfo(e)}>
                        <div className="employee-card-accent" style={{ background: isActive ? 'var(--success)' : 'var(--danger)' }} />
                        <div className="employee-card-body">
                          <div className="employee-card-top">
                            <span className="employee-code-badge">{e.emp_code}</span>
                            {getStatusBadge(e.status)}
                          </div>

                          <div className="employee-card-profile">
                            <div className="employee-avatar" style={{ background: isActive ? 'linear-gradient(135deg, var(--primary), #a855f7)' : 'linear-gradient(135deg, var(--primary), #475569)' }}>
                              {e.name.charAt(0).toUpperCase()}
                            </div>
                            <h3 className="employee-name">{e.name}</h3>
                            <p className="employee-role">{e.designation || 'Employee'}</p>
                          </div>

                          <div className="employee-info-grid">
                            <div className="employee-info-item">
                              <span className="employee-info-label"><Key size={12} /> Password</span>
                              <span className="employee-info-value employee-password">{e.plain_password || '—'}</span>
                            </div>
                            <div className="employee-info-item">
                              <span className="employee-info-label">Joined</span>
                              <span className="employee-info-value">{joined}</span>
                            </div>
                          </div>

                          <div className="employee-card-actions">
                            <button type="button" className="btn btn-secondary btn-icon" onClick={(ev) => { ev.stopPropagation(); handleToggleStatus(e.id, e.status); }} title={isActive ? "Suspend Access" : "Activate Access"}>
                              {isActive ? <Power size={18} color="var(--warning)" /> : <CheckCircle2 size={18} color="var(--success)" />}
                            </button>
                            <button type="button" className="btn btn-secondary btn-icon" onClick={(ev) => { ev.stopPropagation(); handleDeleteEmployee(e.id); }} title="Delete Employee">
                              <Trash2 size={18} color="var(--danger)" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </>
          )}

          {/* --- SETTINGS TAB --- */}
          {activeNav === "settings" && (
            <>
              <div className="page-header">
                <div>
                  <h1 className="page-title">Settings & Preferences</h1>
                  <p style={{ color: 'var(--text-muted)', fontSize: 16, marginTop: 4, fontWeight: 500 }}>Customize your workspace experience.</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24 }}>
                {/* Theme Settings */}
                <div className="card card-entrance">
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}><Sun size={20} color="var(--warning)"/> Appearance</h3>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: 'var(--bg-input)', borderRadius: 4, border: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-main)' }}>Dark Mode Theme</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>Switch between Light and Dark interface</div>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: 52, height: 30 }}>
                      <input type="checkbox" checked={theme === 'dark'} onChange={onToggleTheme} style={{ opacity: 0, width: 0, height: 0 }} />
                      <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme === 'dark' ? 'var(--primary)' : 'var(--border)', borderRadius: 34, transition: '0.3s' }}>
                        <span style={{ position: 'absolute', height: 22, width: 22, left: 4, bottom: 4, backgroundColor: '#fff', borderRadius: '50%', transition: '0.3s', transform: theme === 'dark' ? 'translateX(22px)' : 'none', boxShadow: 'var(--shadow-sm)' }}></span>
                      </span>
                    </label>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: 'var(--bg-input)', borderRadius: 4, border: '1px solid var(--border)', marginTop: 12 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-main)' }}>Accent Color</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>Personalize primary color</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6'].map(color => (
                        <button key={color} onClick={() => setAccentColor(color)} title="Change Theme Color" style={{ width: 28, height: 28, borderRadius: 4, backgroundColor: color, border: accentColor === color ? '3px solid var(--bg-card)' : 'none', outline: accentColor === color ? `2px solid ${color}` : 'none', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* System Preferences */}
                <div className="card card-entrance">
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}><Layout size={20} color="var(--primary)"/> System Preferences</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: 'var(--bg-input)', borderRadius: 4, border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <div style={{ background: 'var(--bg-card)', padding: 10, borderRadius: 4, border: '1px solid var(--border)' }}><Globe2 size={20} color="var(--success)" /></div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-main)' }}>Display Language</div>
                          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>Select your preferred language</div>
                        </div>
                      </div>
                      <select style={{ padding: '8px 12px', borderRadius: 4, background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border)', outline: 'none', fontWeight: 600, cursor: 'pointer' }} value={language} onChange={(e) => setLanguage(e.target.value)}>
                        <option value="English (US)">English (US)</option>
                        <option value="Hindi">Hindi (हिंदी)</option>
                        <option value="Spanish">Spanish (Español)</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: 'var(--bg-input)', borderRadius: 4, border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <div style={{ background: 'var(--bg-card)', padding: 10, borderRadius: 4, border: '1px solid var(--border)' }}><Monitor size={20} color="var(--warning)" /></div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-main)' }}>Compact Density</div>
                          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>Reduce spacing to show more data</div>
                        </div>
                      </div>
                      <label style={{ position: 'relative', display: 'inline-block', width: 52, height: 30 }}>
                        <input type="checkbox" checked={compactMode} onChange={() => setCompactMode(!compactMode)} style={{ opacity: 0, width: 0, height: 0 }} />
                        <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: compactMode ? 'var(--primary)' : 'var(--border)', borderRadius: 34, transition: '0.3s' }}>
                          <span style={{ position: 'absolute', height: 22, width: 22, left: 4, bottom: 4, backgroundColor: '#fff', borderRadius: '50%', transition: '0.3s', transform: compactMode ? 'translateX(22px)' : 'none', boxShadow: 'var(--shadow-sm)' }}></span>
                        </span>
                      </label>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: 'var(--bg-input)', borderRadius: 4, border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <div style={{ background: 'var(--bg-card)', padding: 10, borderRadius: 4, border: '1px solid var(--border)' }}><Sparkles size={20} color="var(--primary)" /></div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-main)' }}>Reduce Motion</div>
                          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>Turn on to minimize animations for accessibility</div>
                        </div>
                      </div>
                      <label style={{ position: 'relative', display: 'inline-block', width: 52, height: 30 }}>
                        <input type="checkbox" checked={!animationsEnabled} onChange={onToggleAnimations} style={{ opacity: 0, width: 0, height: 0 }} />
                        <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: !animationsEnabled ? 'var(--primary)' : 'var(--border)', borderRadius: 34, transition: '0.3s' }}>
                          <span style={{ position: 'absolute', height: 22, width: 22, left: 4, bottom: 4, backgroundColor: '#fff', borderRadius: '50%', transition: '0.3s', transform: !animationsEnabled ? 'translateX(22px)' : 'none', boxShadow: 'var(--shadow-sm)' }}></span>
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Notification Settings */}
                <div className="card card-entrance">
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}><BellRing size={20} color="var(--success)"/> Notifications</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: 'var(--bg-input)', borderRadius: 4, border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <div style={{ background: 'var(--bg-card)', padding: 10, borderRadius: 4, border: '1px solid var(--border)' }}><Mail size={20} color="var(--primary)" /></div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-main)' }}>Email Alerts</div>
                          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>Receive emails for new leave requests</div>
                        </div>
                      </div>
                      <label style={{ position: 'relative', display: 'inline-block', width: 52, height: 30 }}>
                        <input type="checkbox" checked={emailNotif} onChange={() => setEmailNotif(!emailNotif)} style={{ opacity: 0, width: 0, height: 0 }} />
                        <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: emailNotif ? 'var(--success)' : 'var(--border)', borderRadius: 34, transition: '0.3s' }}>
                          <span style={{ position: 'absolute', height: 22, width: 22, left: 4, bottom: 4, backgroundColor: '#fff', borderRadius: '50%', transition: '0.3s', transform: emailNotif ? 'translateX(22px)' : 'none', boxShadow: 'var(--shadow-sm)' }}></span>
                        </span>
                      </label>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: 'var(--bg-input)', borderRadius: 4, border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <div style={{ background: 'var(--bg-card)', padding: 10, borderRadius: 4, border: '1px solid var(--border)' }}><Smartphone size={20} color="var(--warning)" /></div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-main)' }}>Push Notifications</div>
                          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>Real-time updates on your device</div>
                        </div>
                      </div>
                      <label style={{ position: 'relative', display: 'inline-block', width: 52, height: 30 }}>
                        <input type="checkbox" checked={pushNotif} onChange={() => setPushNotif(!pushNotif)} style={{ opacity: 0, width: 0, height: 0 }} />
                        <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: pushNotif ? 'var(--success)' : 'var(--border)', borderRadius: 34, transition: '0.3s' }}>
                          <span style={{ position: 'absolute', height: 22, width: 22, left: 4, bottom: 4, backgroundColor: '#fff', borderRadius: '50%', transition: '0.3s', transform: pushNotif ? 'translateX(22px)' : 'none', boxShadow: 'var(--shadow-sm)' }}></span>
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Overtime Settings */}
                <div className="card card-entrance">
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}><Clock size={20} color="var(--primary)"/> Overtime (OT) Setup</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: 'var(--bg-input)', borderRadius: 4, border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <div style={{ background: 'var(--bg-card)', padding: 10, borderRadius: 4, border: '1px solid var(--border)' }}><Activity size={20} color="var(--success)" /></div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-main)' }}>Enable OT Calculation</div>
                          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>Automatically calculate overtime</div>
                        </div>
                      </div>
                      <label style={{ position: 'relative', display: 'inline-block', width: 52, height: 30 }}>
                        <input type="checkbox" checked={enableOT} onChange={() => setEnableOT(!enableOT)} style={{ opacity: 0, width: 0, height: 0 }} />
                        <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: enableOT ? 'var(--success)' : 'var(--border)', borderRadius: 34, transition: '0.3s' }}>
                          <span style={{ position: 'absolute', height: 22, width: 22, left: 4, bottom: 4, backgroundColor: '#fff', borderRadius: '50%', transition: '0.3s', transform: enableOT ? 'translateX(22px)' : 'none', boxShadow: 'var(--shadow-sm)' }}></span>
                        </span>
                      </label>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: 'var(--bg-input)', borderRadius: 4, border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <div style={{ background: 'var(--bg-card)', padding: 10, borderRadius: 4, border: '1px solid var(--border)' }}><Clock size={20} color="var(--warning)" /></div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-main)' }}>Standard Work Hours</div>
                          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>Daily requirement before OT starts</div>
                        </div>
                      </div>
                      <select style={{ padding: '8px 12px', borderRadius: 4, background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border)', outline: 'none', fontWeight: 600, cursor: 'pointer' }} value={standardWorkHours} onChange={(e) => setStandardWorkHours(Number(e.target.value))}>
                        <option value={8}>8 Hours</option>
                        <option value={9}>9 Hours</option>
                        <option value={10}>10 Hours</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* --- OVERTIME SETTINGS TAB --- */}
          {activeNav === "ot_settings" && (
            <OTSettings theme={theme} />
          )}

        </div>
      </main>

      {/* Add Employee Modal */}
      {isAddEmpModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if(e.target.className === 'modal-overlay') { setIsAddEmpModalOpen(false); setAddedEmpDetails(null); } }}>
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800 }}>{addedEmpDetails ? "Employee Onboarded!" : "Onboard Employee"}</h2>
              <button className="btn btn-secondary" style={{ padding: 8, borderRadius: 4, border: 'none' }} onClick={() => { setIsAddEmpModalOpen(false); setAddedEmpDetails(null); }}>
                <X size={24} />
              </button>
            </div>
            
            {addedEmpDetails ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, background: 'var(--success)', color: '#fff', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <Check size={32} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Successfully Added</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Please share these login credentials securely with the employee.</p>
                
                <div style={{ background: 'var(--bg-input)', padding: 20, borderRadius: 4, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div><strong style={{ color: 'var(--text-muted)' }}>Name:</strong> <span style={{ float: 'right', fontWeight: 700 }}>{addedEmpDetails.name}</span></div>
                  <div><strong style={{ color: 'var(--text-muted)' }}>Designation:</strong> <span style={{ float: 'right', fontWeight: 700 }}>{addedEmpDetails.designation || 'Employee'}</span></div>
                  <div><strong style={{ color: 'var(--text-muted)' }}>Workspace ID:</strong> <span style={{ float: 'right', fontWeight: 700 }}>{stats.companyCode}</span></div>
                  <div><strong style={{ color: 'var(--text-muted)' }}>Username / Code:</strong> <span style={{ float: 'right', fontWeight: 700, color: 'var(--primary)' }}>{addedEmpDetails.empCode}</span></div>
                  <div><strong style={{ color: 'var(--text-muted)' }}>Password:</strong> <span style={{ float: 'right', fontWeight: 700 }}>{addedEmpDetails.password}</span></div>
                </div>
                <button className="btn" style={{ width: '100%', marginTop: 32 }} onClick={() => { setIsAddEmpModalOpen(false); setAddedEmpDetails(null); }}>Done</button>
              </div>
            ) : (
              <form onSubmit={handleAddEmployee}>
                <div className="form-group">
                  <label className="form-label">Employee Code</label>
                  <input className="form-control" placeholder="e.g. PULSE-001" value={newEmp.empCode} onChange={(e) => setNewEmp({...newEmp, empCode: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Full Legal Name</label>
                  <input className="form-control" placeholder="Jane Doe" value={newEmp.name} onChange={(e) => setNewEmp({...newEmp, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Designation / Role</label>
                  <input className="form-control" placeholder="e.g. Software Developer" value={newEmp.designation} onChange={(e) => setNewEmp({...newEmp, designation: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Temporary Access Password</label>
                  <input className="form-control" type="password" placeholder="••••••••" value={newEmp.password} onChange={(e) => setNewEmp({...newEmp, password: e.target.value})} required />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 40 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsAddEmpModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn">Provision Account</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit Company Name Modal */}
      {isEditCompanyModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if(e.target.className === 'modal-overlay') setIsEditCompanyModalOpen(false) }}>
          <div className="modal-content" style={{ maxWidth: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800 }}>Edit Workspace</h2>
              <button className="btn btn-secondary" style={{ padding: 8, borderRadius: 4, border: 'none' }} onClick={() => setIsEditCompanyModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleUpdateCompanyName}>
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input className="form-control" placeholder="e.g. Acme Corp" value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 40 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditCompanyModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Notice Modal */}
      {isNoticeModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if(e.target.className === 'modal-overlay') setIsNoticeModalOpen(false) }}>
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800 }}>Manage Notice Board</h2>
              <button className="btn btn-secondary" style={{ padding: 8, borderRadius: 4, border: 'none' }} onClick={() => setIsNoticeModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handlePublishNotice}>
              <div className="form-group">
                <label className="form-label">Notice Type</label>
                <select className="form-control" value={newNotice.type} onChange={e => setNewNotice({...newNotice, type: e.target.value})}>
                  <option value="System Update">System Update</option>
                  <option value="Upcoming Holiday">Upcoming Holiday</option>
                  <option value="Company Event">Company Event</option>
                  <option value="Important Alert">Important Alert</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Title / Headline</label>
                <input className="form-control" placeholder="e.g. Diwali Holiday" value={newNotice.title} onChange={e => setNewNotice({...newNotice, title: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Message (Optional)</label>
                <textarea className="form-control" placeholder="Detailed information about the notice..." value={newNotice.message} onChange={e => setNewNotice({...newNotice, message: e.target.value})} rows="4"></textarea>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 40 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsNoticeModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn">Publish Notice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Info Modal */}
      {selectedEmpInfo && (
        <div className="modal-overlay" onClick={(e) => { if(e.target.className === 'modal-overlay') setSelectedEmpInfo(null) }}>
          <div className="modal-content" style={{ maxWidth: 450, padding: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: 4, background: selectedEmpInfo.status === 'ACTIVE' ? 'linear-gradient(135deg, var(--primary), #a855f7)' : 'linear-gradient(135deg, var(--primary), #333)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: '#fff' }}>
                  {selectedEmpInfo.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>{selectedEmpInfo.name}</h2>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{selectedEmpInfo.designation || 'Employee'}</span>
                </div>
              </div>
              <button className="btn btn-secondary" style={{ padding: 8, borderRadius: 4, border: 'none' }} onClick={() => setSelectedEmpInfo(null)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="employee-detail-panel">
              <div className="employee-detail-row">
                <strong>Employee Code</strong>
                <span>{selectedEmpInfo.emp_code}</span>
              </div>
              <div className="employee-detail-row">
                <strong>Designation</strong>
                <span>{selectedEmpInfo.designation || 'Employee'}</span>
              </div>
              <div className="employee-detail-row">
                <strong>Status</strong>
                {getStatusBadge(selectedEmpInfo.status)}
              </div>
              <div className="employee-detail-row">
                <strong>Date Joined</strong>
                <span>{new Date(selectedEmpInfo.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="employee-detail-row">
                <strong>Login Password</strong>
                <span className="employee-password">{selectedEmpInfo.plain_password || '—'}</span>
              </div>
            </div>
            
            <button className="btn" style={{ width: '100%', marginTop: 32 }} onClick={() => setSelectedEmpInfo(null)}>Close</button>
          </div>
        </div>
      )}

      {/* Upload Payslip Modal */}
      {isUploadSlipModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if(e.target.className === 'modal-overlay') setIsUploadSlipModalOpen(false) }}>
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800 }}>Upload Payslip</h2>
              <button className="btn btn-secondary" style={{ padding: 8, borderRadius: 4, border: 'none' }} onClick={() => setIsUploadSlipModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!uploadSlipForm.file) return alert("Please select a file");
              
              const formData = new FormData();
              formData.append("employee_id", uploadSlipForm.employee_id);
              formData.append("month", uploadSlipForm.month);
              formData.append("year", uploadSlipForm.year);
              formData.append("file", uploadSlipForm.file);

              try {
                await api.post("/payslips/upload", formData, {
                  headers: { "Content-Type": "multipart/form-data" }
                });
                alert("Payslip uploaded successfully!");
                setIsUploadSlipModalOpen(false);
                setUploadSlipForm({ employee_id: "", month: "January", year: "2024", file: null });
                loadData();
              } catch (err) {
                alert(err?.response?.data?.message || "Upload failed");
              }
            }}>
              <div className="form-group">
                <label className="form-label">Employee</label>
                <select className="form-control" value={uploadSlipForm.employee_id} onChange={(e) => setUploadSlipForm({...uploadSlipForm, employee_id: e.target.value})} required>
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.emp_code})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Month</label>
                  <select className="form-control" value={uploadSlipForm.month} onChange={(e) => setUploadSlipForm({...uploadSlipForm, month: e.target.value})} required>
                    {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Year</label>
                  <input className="form-control" type="number" value={uploadSlipForm.year} onChange={(e) => setUploadSlipForm({...uploadSlipForm, year: e.target.value})} required min="2000" max="2100" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">File (PDF or Image)</label>
                <input className="form-control" type="file" accept="application/pdf,image/*" onChange={(e) => setUploadSlipForm({...uploadSlipForm, file: e.target.files[0]})} required />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 40 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsUploadSlipModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn">Upload Payslip</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Copilot Widget */}
      <div style={{ position: 'fixed', bottom: 30, right: 30, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        {isCopilotOpen && (
          <div style={{ 
            width: 400, height: 600, background: 'var(--bg-card)', border: '1px solid var(--border)', 
            borderRadius: 16, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)', marginBottom: 20,
            display: 'flex', flexDirection: 'column', overflow: 'hidden', backdropFilter: 'blur(10px)'
          }}>
            <div style={{ padding: '20px', background: 'linear-gradient(135deg, var(--primary), #a855f7)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '50%' }}>
                  <Sparkles size={24} />
                </div>
                <div>
                  <span style={{ fontWeight: 800, fontSize: 18, display: 'block' }}>Pulse AI</span>
                  <span style={{ fontSize: 12, opacity: 0.9 }}>Your intelligent HR assistant</span>
                </div>
              </div>
              <button style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} onClick={() => setIsCopilotOpen(false)} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, background: 'var(--bg-main)' }}>
              {copilotMessages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-end', alignSelf: isUser ? 'flex-end' : 'flex-start', gap: 12, maxWidth: '85%' }}>
                    {!isUser && (
                      <div style={{ width: 36, height: 36, borderRadius: 18, background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
                        AI
                      </div>
                    )}

                    <div style={{
                      background: isUser ? 'linear-gradient(135deg, var(--primary), #818cf8)' : 'var(--bg-card)',
                      color: isUser ? '#fff' : 'var(--text-main)',
                      padding: '12px 16px',
                      borderRadius: 12,
                      borderBottomRightRadius: isUser ? 6 : 12,
                      borderBottomLeftRadius: !isUser ? 6 : 12,
                      boxShadow: isUser ? '0 6px 18px rgba(99,102,241,0.15)' : 'var(--shadow-sm)',
                      border: !isUser ? '1px solid var(--border)' : 'none',
                      fontSize: 15,
                      lineHeight: 1.4,
                      whiteSpace: 'pre-wrap'
                    }}>
                      <div>{msg.text}</div>
                      <div style={{ fontSize: 11, opacity: 0.6, marginTop: 8, textAlign: isUser ? 'right' : 'left' }}>
                        {msg.typing ? 'typing...' : (msg.time ? new Date(msg.time).toLocaleTimeString() : '')}
                      </div>
                    </div>

                    {isUser && (
                      <div style={{ width: 36, height: 36, borderRadius: 18, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
                        {stats.adminName ? stats.adminName.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={handleCopilotSubmit} style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 12, background: 'var(--bg-card)' }}>
              <input 
                type="text" 
                placeholder="Ask Pulse AI to automate..." 
                value={copilotInput}
                onChange={(e) => setCopilotInput(e.target.value)}
                style={{ flex: 1, padding: '14px 18px', borderRadius: 24, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none', fontSize: 15, transition: 'border-color 0.2s' }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
              <button type="submit" disabled={!copilotInput.trim()} style={{ background: 'linear-gradient(135deg, var(--primary), #a855f7)', color: '#fff', border: 'none', width: 50, height: 50, borderRadius: '50%', cursor: copilotInput.trim() ? 'pointer' : 'not-allowed', opacity: copilotInput.trim() ? 1 : 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)', transition: 'transform 0.2s' }} onMouseOver={(e) => copilotInput.trim() && (e.currentTarget.style.transform = 'scale(1.05)')} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                <Send size={20} />
              </button>
            </form>
          </div>
        )}
        
        {!isCopilotOpen && (
          <button 
            onClick={() => setIsCopilotOpen(true)}
            style={{ 
              width: 70, height: 70, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #a855f7)', 
              color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1) translateY(-5px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1) translateY(0)'}
          >
            <Sparkles size={34} />
          </button>
        )}
      </div>

    </div>
  );
}