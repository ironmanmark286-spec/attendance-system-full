import { useEffect, useState } from "react";
import api from "../api";
import {
  Activity,
  BarChart3,
  Building,
  CheckCircle,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import NetworkBackground from "../components/NetworkBackground";
import ParallaxBlobs from "../components/ParallaxBlobs";

export default function Login({ theme, onToggleTheme, animationsEnabled }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("error");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registeredWorkspace, setRegisteredWorkspace] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("workspaceId");
    if (saved && saved.startsWith("WS-")) {
      setCompanyCode(saved);
    } else {
      localStorage.removeItem("workspaceId");
    }
  }, []);

  const copyWorkspaceId = (id) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMsg("");
    setMsgType("error");

    try {
      if (isRegistering) {
        const res = await api.post("/auth/register", {
          companyName,
          username,
          password,
          adminEmail: adminEmail || undefined,
        });
        setRegisteredWorkspace({
          workspaceId: res.data.workspaceId,
          companyName: res.data.companyName,
        });
        setCompanyCode(res.data.workspaceId);
        localStorage.setItem("workspaceId", res.data.workspaceId);
        setMsg(res.data.message);
        setMsgType("success");
        setIsRegistering(false);
      } else if (isResetting) {
        const res = await api.post("/auth/reset-password", {
          companyCode,
          username,
          newPassword: password,
        });
        setMsg(res.data.message || "Password reset successful. Please login.");
        setMsgType("success");
        setIsResetting(false);
        setPassword("");
      } else {
        const { data } = await api.post("/auth/login", { companyCode, username, password });
        if (data.role === "EMPLOYEE") {
          setIsLoading(false);
          return setMsg("Access denied: employees must use the mobile app.");
        }
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("workspaceId", data.workspaceId || companyCode);
        window.location.href = data.subscriptionExpired ? "/billing" : "/dashboard";
      }
    } catch (err) {
      setMsg(
        err?.response?.data?.message ||
          (isRegistering ? "Registration failed." : isResetting ? "Reset failed." : "Authentication failed.")
      );
      setMsgType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const modeTitle = isRegistering ? "Create workspace" : isResetting ? "Reset password" : "Welcome back";
  const modeSubtitle = isRegistering
    ? "Set up a private company workspace for attendance and HR operations."
    : isResetting
      ? "Enter your workspace and admin username to create a new password."
      : "Sign in to manage your company attendance workspace.";

  return (
    <div className="auth-page">
      <NetworkBackground />
      <ParallaxBlobs animate={animationsEnabled} />

      <div className="auth-shell">
        <section className="auth-panel auth-brand-panel">
          <div className="auth-brand-mark">
            <Activity size={30} />
          </div>
          <div>
            <p className="auth-kicker">PulseHR Workspace</p>
            <h1>Attendance operations, cleanly separated by company.</h1>
            <p className="auth-lead">
              Each Workspace ID opens only its own employees, logs, reports, and payroll records.
            </p>
          </div>

          <div className="auth-proof-grid">
            <div className="auth-proof-item">
              <ShieldCheck size={20} />
              <span>Private workspace access</span>
            </div>
            <div className="auth-proof-item">
              <Users size={20} />
              <span>Employee attendance control</span>
            </div>
            <div className="auth-proof-item">
              <BarChart3 size={20} />
              <span>Monthly logs and payroll views</span>
            </div>
          </div>
        </section>

        <section className="auth-panel auth-form-panel bounce-in">
          <div className="auth-toolbar">
            <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
          </div>

          <div className="auth-form-heading fade-in-up stagger-1">
            <div className="auth-form-logo">
              <Activity size={26} />
            </div>
            <div>
              <h2>
                Pulse<span>HR</span>
              </h2>
              <p>{modeTitle}</p>
            </div>
          </div>

          <p className="auth-subtitle">{modeSubtitle}</p>

          {registeredWorkspace && (
            <div className="workspace-created">
              <CheckCircle size={28} />
              <div>
                <p>Workspace Created</p>
                <small>{registeredWorkspace.companyName}</small>
              </div>
              <div className="workspace-id-box">
                <div>
                  <span>Your Workspace ID</span>
                  <strong>{registeredWorkspace.workspaceId}</strong>
                </div>
                <button type="button" onClick={() => copyWorkspaceId(registeredWorkspace.workspaceId)}>
                  {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          )}

          <form onSubmit={onSubmit} className="auth-form">
            {isRegistering && (
              <>
                <div className="auth-field fade-in-up stagger-2">
                  <label htmlFor="companyName">Company Name</label>
                  <div className="auth-input-wrap">
                    <Building size={18} />
                    <input
                      id="companyName"
                      name="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Acme Corp Ltd."
                      required={isRegistering}
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <label htmlFor="adminEmail">Admin Email (Optional)</label>
                  <div className="auth-input-wrap">
                    <Mail size={18} />
                    <input
                      id="adminEmail"
                      name="adminEmail"
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@yourcompany.com"
                    />
                  </div>
                </div>

                <div className="auth-note">A unique Workspace ID will be generated automatically.</div>
              </>
            )}

            {!isRegistering && (
              <div className="auth-field fade-in-up stagger-3">
                <div className="auth-label-row">
                  <label htmlFor="companyCode">Workspace ID</label>
                  <button
                    type="button"
                    onClick={() =>
                      alert("Please check the welcome email sent to your admin email during registration, or ask your HR/Admin.")
                    }
                  >
                    Forgot ID?
                  </button>
                </div>
                <div className="auth-input-wrap auth-workspace-input">
                  <Building size={18} />
                  <input
                    id="companyCode"
                    name="companyCode"
                    value={companyCode}
                    onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                    placeholder="WS-A7X9K2"
                    required
                  />
                </div>
              </div>
            )}

            <div className="auth-field fade-in-up stagger-4">
              <label htmlFor="username">Username</label>
              <div className="auth-input-wrap">
                <User size={18} />
                <input
                  id="username"
                  name="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={isRegistering ? "Create admin username" : "admin"}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="auth-field fade-in-up stagger-5">
              <label htmlFor="password">{isResetting ? "New Password" : "Password"}</label>
              <div className="auth-input-wrap">
                <Lock size={18} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isRegistering || isResetting ? "Create strong password" : "Password"}
                  required
                  autoComplete={isRegistering || isResetting ? "new-password" : "current-password"}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="auth-eye-btn">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {!isRegistering && (
                <div className="auth-reset-row">
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetting(!isResetting);
                      setMsg("");
                    }}
                  >
                    {isResetting ? "Back to Login" : "Forgot Password?"}
                  </button>
                </div>
              )}
            </div>

            {msg && <div className={`auth-message ${msgType === "success" ? "success" : "error"}`}>{msg}</div>}

            <button className="auth-submit fade-in-up stagger-6" type="submit" disabled={isLoading}>
              {isLoading ? "Processing..." : isRegistering ? "Create Workspace" : isResetting ? "Reset Password" : "Secure Login"}
            </button>
          </form>

          <div className="auth-footer-switch fade-in-up stagger-7">
            {!isResetting && (
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setMsg("");
                  setIsResetting(false);
                  setRegisteredWorkspace(null);
                }}
              >
                {isRegistering ? "Already have a workspace? Sign In" : "Don't have a workspace? Register Company"}
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
