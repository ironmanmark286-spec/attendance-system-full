import { useState } from "react";
import api from "../api";
import { Activity, Lock, User, Building, Sun, Moon, Eye, EyeOff } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import NetworkBackground from "../components/NetworkBackground";
import ParallaxBlobs from "../components/ParallaxBlobs";

export default function Login({ theme, onToggleTheme, animationsEnabled, onToggleAnimations }) {
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
    <div className="page-wrap" style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      backgroundImage: 'url("/login-bg.svg")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      position: 'relative', 
      overflow: 'hidden' 
    }}>
      <NetworkBackground />

      {/* subtle overlay to increase contrast */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,25,43,0.08), rgba(3,7,18,0.18))', zIndex: 1 }}></div>

      {/* Parallax ambient blobs */}
      <ParallaxBlobs animate={animationsEnabled} />

      {/* Glassmorphic Login Window */}
      <div className="card bounce-in" style={{ width: '100%', maxWidth: '460px', padding: '56px 48px', borderRadius: '40px', position: 'relative', zIndex: 10, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)', backdropFilter: 'blur(24px)' }}>
        
        {/* Theme Toggle */}
        <div style={{ position: 'absolute', top: '28px', right: '28px', zIndex: 20 }}>
          <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
        </div>

        <div className="fade-in-up stagger-1 hero-entrance" style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div className="pulse-fast hover-grow" style={{ width: '72px', height: '72px', background: 'linear-gradient(135deg, var(--primary), #a855f7)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', margin: '0 auto 24px', boxShadow: '0 10px 25px -5px var(--primary)' }}>
            <Activity size={32} />
          </div>
          <h2 style={{ fontSize: '36px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-1.5px', marginBottom: '8px' }}>Pulse<span style={{ color: 'var(--primary)' }}>HR</span></h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', fontWeight: 500 }}>
            {isRegistering ? "Register your new workspace" : (isResetting ? "Reset your password" : "Sign in to your workspace")}
          </p>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {isRegistering && (
            <div className="form-group fade-in-up stagger-2" style={{ marginBottom: 0 }}>
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

          <div className="form-group fade-in-up stagger-3" style={{ marginBottom: 0 }}>
            <label htmlFor="companyCode" className="form-label" style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Workspace ID</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Building size={18} />
              </div>
              <input
                id="companyCode"
                name="companyCode"
                className="form-control hover-lift"
                value={companyCode}
                onChange={(e) => setCompanyCode(e.target.value)}
                placeholder="e.g. CMP-01"
                required
                style={{ paddingLeft: '48px', height: '56px', fontSize: '16px' }}
              />
            </div>
          </div>

          <div className="form-group fade-in-up stagger-4" style={{ marginBottom: 0 }}>
            <label htmlFor="username" className="form-label" style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Username</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <User size={18} />
              </div>
              <input
                id="username"
                name="username"
                className="form-control hover-lift"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isRegistering ? "Create admin username" : "admin"}
                required
                autoComplete="username"
                style={{ paddingLeft: '48px', height: '56px', fontSize: '16px' }}
              />
            </div>
          </div>

          <div className="form-group fade-in-up stagger-5" style={{ marginBottom: 0 }}>
            <label htmlFor="password" className="form-label" style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>{isResetting ? "New Password" : "Password"}</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Lock size={18} />
              </div>
              <input
                id="password"
                name="password"
                className="form-control hover-lift"
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
            <div style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '12px 16px', borderRadius: '4px', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '4px', height: '100%', background: 'var(--danger)', borderRadius: '4px' }}></div>
              {msg}
            </div>
          )}

          <button 
            className="btn fade-in-up stagger-6 hover-lift hover-glow" 
            type="submit" 
            disabled={isLoading}
            style={{ 
              width: "100%", 
              height: '60px', 
              marginTop: '20px', 
              fontSize: '16px', 
              fontWeight: 700,
              background: 'linear-gradient(135deg, var(--primary), #8b5cf6)',
              opacity: isLoading ? 0.7 : 1,
              borderRadius: '50px',
              border: 'none',
              color: '#fff',
              boxShadow: '0 10px 25px -5px var(--primary)'
            }}
          >
            {isLoading ? "Processing..." : (isRegistering ? "Create Workspace" : (isResetting ? "Reset Password" : "Secure Login"))}
          </button>
        </form>
        
        <div className="fade-in-up stagger-7" style={{ textAlign: 'center', marginTop: '32px' }}>
          {!isResetting && (
            <button 
              type="button" 
              className="hover-grow"
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