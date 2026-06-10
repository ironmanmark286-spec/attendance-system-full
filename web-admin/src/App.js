import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Billing from "./pages/Billing";
import "./styles-pro.css";
import "./animations.css";

function PrivateRoute({ children }) {
  return localStorage.getItem("token") ? children : <Navigate to="/" />;
}

const GlobalDesignOverrides = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
    
    :root {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif !important;
    }
    
    body {
      background-image: 
        radial-gradient(circle at 0% 0%, rgba(99, 102, 241, 0.08) 0%, transparent 40%), 
        radial-gradient(circle at 100% 100%, rgba(168, 85, 247, 0.08) 0%, transparent 40%) !important;
      background-attachment: fixed;
      letter-spacing: -0.01em;
    }

    html.theme-dark body, html.dark-mode body {
      background-image: 
        radial-gradient(circle at 0% 0%, rgba(99, 102, 241, 0.12) 0%, transparent 40%), 
        radial-gradient(circle at 100% 100%, rgba(139, 92, 246, 0.1) 0%, transparent 40%) !important;
    }

    /* Floating Layout Architecture */
    .app-layout {
      display: flex;
      flex-direction: row;
      min-height: 100vh;
      padding: 16px;
      gap: 16px;
      background: transparent !important;
    }
    
    .sidebar {
      width: 260px;
      flex-shrink: 0;
      border-radius: 24px !important;
      height: calc(100vh - 32px) !important;
      background: var(--bg-card) !important;
      border: 1px solid var(--border) !important;
      backdrop-filter: blur(24px) !important;
      box-shadow: 0 10px 40px -10px rgba(0,0,0,0.05) !important;
      display: flex;
      flex-direction: column;
      padding: 24px 16px 16px 16px !important; /* Bottom padding fixed & reduced */
    }
    
    .topbar {
      border-radius: 24px !important;
      margin-bottom: 24px !important;
      background: var(--bg-card) !important;
      border: 1px solid var(--border) !important;
      backdrop-filter: blur(24px) !important;
      box-shadow: 0 10px 40px -10px rgba(0,0,0,0.05) !important;
    }

    /* Glassmorphic Cards & UI Elements */
    .card, .employee-card, .table-container, .modal-content {
      border-radius: 28px !important;
      background: var(--bg-card) !important;
      border: 1px solid var(--border) !important;
      backdrop-filter: blur(20px) !important;
      box-shadow: 0 20px 40px -20px rgba(0,0,0,0.05) !important;
    }

    .btn {
      border-radius: 999px !important; /* Pill Shape */
      font-weight: 800 !important;
      text-transform: uppercase;
      letter-spacing: 1px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }
    
    .btn:hover {
      transform: translateY(-2px) scale(1.02);
      box-shadow: 0 10px 25px -5px var(--primary-light, rgba(99, 102, 241, 0.4));
    }

    .form-control, .search-input, select {
      border-radius: 16px !important;
    }

    .page-header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }

    /* Sidebar Navigation Perfect Alignment */
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 8px;
    }

    .nav-menu {
      display: flex;
      flex-direction: column;
      gap: 6px; /* Perfect gap between tabs */
      margin: 24px 0 12px 0;
    }

    .sidebar-footer {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: -4px; /* Reduced bottom space near Sign Out */
    }

    .nav-item {
      display: flex !important;
      align-items: center !important;
      gap: 12px !important; /* Precise spacing between Icon and Text */
      width: 100%;
      justify-content: flex-start;
    }

  /* Modern Invisible Scrollbars */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 10px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: var(--text-muted);
  }

  /* Sidebar Collapsed Mode */
  .sidebar {
    transition: width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), padding 0.3s !important;
  }
  .sidebar.collapsed {
    width: 88px !important;
    padding: 24px 12px 16px 12px !important;
  }
  .sidebar.collapsed .brand-text,
  .sidebar.collapsed .nav-item span {
    display: none !important;
  }
  .sidebar.collapsed .nav-item {
    font-size: 0px !important; /* Smoothly hides text without breaking flex */
    justify-content: center !important;
    padding: 12px 0 !important;
    gap: 0 !important;
  }
  .sidebar.collapsed .brand {
    justify-content: center !important;
    padding: 0 !important;
  }
  
  /* Enhanced Active Tab Indicator */
  .nav-item.active {
    box-shadow: inset 4px 0 0 var(--primary) !important;
  }

  /* Skeleton Shimmer Effect */
  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }
  .skeleton {
    background: linear-gradient(90deg, var(--bg-input) 25%, var(--border) 50%, var(--bg-input) 75%);
    background-size: 1000px 100%;
    animation: shimmer 2s infinite linear;
    border-radius: 8px;
  }

  /* Floating Action Button (FAB) */
  .fab-container {
    position: fixed;
    bottom: 120px;
    right: 30px;
    z-index: 9998;
    display: flex;
    flex-direction: column-reverse;
    align-items: flex-end;
    gap: 16px;
  }
  .fab-menu {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: flex-end;
    opacity: 0;
    pointer-events: none;
    transform: translateY(20px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .fab-menu.open {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
  }
  .fab-item {
    display: flex; align-items: center; gap: 12px;
    background: var(--bg-card); padding: 10px 16px; border-radius: 30px;
    border: 1px solid var(--border); box-shadow: var(--shadow-md);
    color: var(--text-main); font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.2s;
  }
  .fab-item:hover { background: var(--bg-hover); transform: scale(1.05); }

    /* =========================================
       MOBILE RESPONSIVE DESIGN (PHONES & TABLETS)
       ========================================= */
    @media (max-width: 992px) {
      .app-layout {
        flex-direction: column !important;
        padding: 8px !important;
      }
      
      .sidebar {
        width: 100% !important;
        height: auto !important;
        flex-direction: row !important;
        padding: 10px !important;
        margin-bottom: 8px !important;
        overflow-x: auto;
      }
      
      .sidebar .brand {
        display: none !important; /* Phone me logo text hide karein */
      }
      
      .nav-menu {
        flex-direction: row !important;
        gap: 8px;
        overflow-x: auto;
      }
      
      .nav-item {
        flex: 0 0 auto;
        padding: 8px 16px !important;
      }
      
      .sidebar-footer {
        display: none !important;
      }
      
      .topbar {
        flex-direction: column;
        gap: 16px;
        padding: 16px !important;
      }
      
      .search-box {
        width: 100% !important;
      }
      
      .user-profile {
        width: 100%;
        justify-content: space-between;
        overflow-x: auto;
      }

      /* Dashboard Grids ko Single Column banayein */
      div[style*="gridTemplateColumns"], 
      div[style*="grid-template-columns"] {
        display: flex !important;
        flex-direction: column !important;
        gap: 16px !important;
      }
      
      .table-wrapper, .table-container {
        overflow-x: auto;
        width: 100%;
      }
    }
  `}</style>
);

export default function App() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  useEffect(() => {
    const savedAccent = localStorage.getItem("accentColor");
    if (savedAccent) {
      [document.documentElement, document.body].forEach((el) => {
        el.style.setProperty("--primary", savedAccent);
        el.style.setProperty("--primary-hover", savedAccent);
        el.style.setProperty("--primary-bg", `${savedAccent}26`);
      });
    }
  }, []);
  const [animationsEnabled, setAnimationsEnabled] = useState(() => {
    const v = localStorage.getItem('animationsEnabled');
    return v === null ? true : v === 'true';
  });

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const classes = ["dark-mode", "light-mode", "theme-dark", "theme-light"];
    html.classList.remove(...classes);
    body.classList.remove(...classes);

    if (theme === "light") {
      html.classList.add("light-mode", "theme-light");
      body.classList.add("light-mode", "theme-light");
    } else {
      html.classList.add("dark-mode", "theme-dark");
      body.classList.add("dark-mode", "theme-dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    // Add a class to the body so CSS can fully disable animations when requested
    if (animationsEnabled) {
      document.body.classList.remove('reduced-motion');
    } else {
      document.body.classList.add('reduced-motion');
    }
  }, [animationsEnabled]);

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  const toggleAnimations = () => {
    setAnimationsEnabled(prev => {
      const next = !prev;
      localStorage.setItem('animationsEnabled', String(next));
      return next;
    });
  };

  return (
    <BrowserRouter>
      <GlobalDesignOverrides />
      <Routes>
        <Route path="/" element={<Login theme={theme} onToggleTheme={toggleTheme} animationsEnabled={animationsEnabled} onToggleAnimations={toggleAnimations} />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard theme={theme} onToggleTheme={toggleTheme} animationsEnabled={animationsEnabled} onToggleAnimations={toggleAnimations} />
            </PrivateRoute>
          }
        />
        <Route
          path="/billing"
          element={
            <PrivateRoute>
              <Billing />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
