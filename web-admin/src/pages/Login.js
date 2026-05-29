import { useState } from "react";
import api from "../api";
import { Activity, Lock, User, Building, Sun, Moon, Eye, EyeOff } from "lucide-react";

export default function Login({ theme, onToggleTheme }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMsg("");
    try {
      if (isRegistering) {
        const res = await api.post("/auth/register", { companyName, companyCode, username, password });
        setMsg(res.data.message || "Registration successful! Please login.");
        setIsRegistering(false); // Switch to login view automatically
      } else if (isResetting) {
        const res = await api.post("/auth/reset-password", { companyCode, username, newPassword: password });
        setMsg(res.data.message || "Password reset successful! Please login.");
        setIsResetting(false);
        setPassword("");
      } else {
        const { data } = await api.post("/auth/login", { companyCode, username, password });
        if (data.role === "EMPLOYEE") {
          setIsLoading(false);
          return setMsg("Access Denied: Employees must use the mobile app.");
        }
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setMsg(err?.response?.data?.message || (isRegistering ? "Registration failed." : (isResetting ? "Reset failed." : "Authentication failed.")));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-wrap" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.3), rgba(15, 23, 42, 0.7)), url("https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop")', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>

      <div className="card fade-in" style={{ width: '100%', maxWidth: '440px', padding: '48px', borderRadius: '32px', position: 'relative', zIndex: 10, backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.65)' : 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.5)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' }}>
        
        {/* Theme Toggle */}
        <button 
          onClick={onToggleTheme} 
          style={{ position: 'absolute', top: '24px', right: '24px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '12px', padding: '8px', cursor: 'pointer', color: 'var(--text-main)' }}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, var(--primary), #a855f7)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', margin: '0 auto 24px', boxShadow: '0 10px 25px rgba(99, 102, 241, 0.4)' }}>
            <Activity size={32} />
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-1px', marginBottom: '8px' }}>Pulse<span style={{ color: 'var(--primary)' }}>HR</span></h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', fontWeight: 500 }}>
            {isRegistering ? "Register your new workspace" : (isResetting ? "Reset your password" : "Sign in to your workspace")}
          </p>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {isRegistering && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="companyName" className="form-label" style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Company Name</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <Building size={18} />
                </div>
                <input
                  id="companyName"
                  name="companyName"
                  className="form-control"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Corp Ltd."
                  required={isRegistering}
                  style={{ paddingLeft: '48px', height: '56px', fontSize: '16px' }}
                />
              </div>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="companyCode" className="form-label" style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Workspace ID</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Building size={18} />
              </div>
              <input
                id="companyCode"
                name="companyCode"
                className="form-control"
                value={companyCode}
                onChange={(e) => setCompanyCode(e.target.value)}
                placeholder="e.g. CMP-01"
                required
                style={{ paddingLeft: '48px', height: '56px', fontSize: '16px' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="username" className="form-label" style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Username</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <User size={18} />
              </div>
              <input
                id="username"
                name="username"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isRegistering ? "Create admin username" : "admin"}
                required
                autoComplete="username"
                style={{ paddingLeft: '48px', height: '56px', fontSize: '16px' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="password" className="form-label" style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>{isResetting ? "New Password" : "Password"}</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Lock size={18} />
              </div>
              <input
                id="password"
                name="password"
                className="form-control"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isRegistering || isResetting ? "Create strong password" : "••••••••"}
                required
                autoComplete={isRegistering || isResetting ? "new-password" : "current-password"}
                style={{ paddingLeft: '48px', paddingRight: '48px', height: '56px', fontSize: '16px', letterSpacing: password && !showPassword ? '3px' : 'normal' }}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {!isRegistering && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => { setIsResetting(!isResetting); setMsg(""); }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {isResetting ? "Back to Login" : "Forgot Password?"}
                </button>
              </div>
            )}
          </div>

          {msg && (
            <div style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '4px', height: '100%', background: 'var(--danger)', borderRadius: '4px' }}></div>
              {msg}
            </div>
          )}

          <button 
            className="btn" 
            type="submit" 
            disabled={isLoading}
            style={{ 
              width: "100%", 
              height: '56px', 
              marginTop: '12px', 
              fontSize: '16px', 
              fontWeight: 700,
              background: 'linear-gradient(135deg, var(--primary), #8b5cf6)',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? "Processing..." : (isRegistering ? "Create Workspace" : (isResetting ? "Reset Password" : "Secure Login"))}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          {!isResetting && (
            <button 
              type="button" 
              onClick={() => { setIsRegistering(!isRegistering); setMsg(""); setIsResetting(false); }} 
              style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '14px', fontWeight: 700 }}
            >
              {isRegistering ? "Already have a workspace? Sign In" : "Don't have a workspace? Register Company"}
            </button>
          )}
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500, marginTop: 16 }}>Protected by Enterprise-Grade Security</p>
        </div>
      </div>
    </div>
  );
}