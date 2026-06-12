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
      padding: 24px 16px 12px 16px !important; /* Bottom padding fixed & reduced */
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
      gap: 10px !important; /* Perfect gap between tabs */
      margin: 20px 0 12px 0;
      padding-bottom: 8px; /* Extra space before footer */
    }

    .sidebar-footer {
      display: flex;
      flex-direction: column;
      gap: 8px !important;
      margin-bottom: 0 !important; /* Reduced bottom space near Sign Out */
    }

    .nav-item {
      display: flex !important;
      align-items: center !important;
      gap: 12px !important; /* Precise spacing between Icon and Text */
      width: 100%;
      justify-content: flex-start;
      padding: 12px 16px !important; /* Proper internal spacing */
      border-radius: 12px !important;
      margin: 0 !important; /* Prevent overlap */
      white-space: nowrap !important; /* Text ko 1 line mein force karne ke liye */
      overflow: hidden !important;
      text-overflow: ellipsis !important;
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
        padding: 0 !important;
        min-height: 100vh;
      }
      
      /* Drawer Sidebar Navigation */
      .sidebar {
        position: fixed !important;
        top: 0 !important;
        left: -320px !important;
        width: 280px !important;
        height: 100vh !important;
        flex-direction: column !important;
        padding: 24px 16px !important;
        margin: 0 !important;
        border-radius: 0 !important;
        z-index: 10000 !important;
        overflow-y: auto !important;
        transition: left 0.3s ease !important;
        box-shadow: 10px 0 40px rgba(0,0,0,0.2) !important;
        background: var(--bg-card) !important;
      }
      
      /* Use the existing collapsed state to open the drawer on mobile */
      .sidebar.collapsed {
        left: 0 !important;
        width: 280px !important;
      }
      
      .sidebar.collapsed .brand-text,
      .sidebar.collapsed .nav-item span {
        display: block !important;
        opacity: 1 !important;
        transform: translateX(0) !important;
        width: auto !important;
      }
      
      .sidebar.collapsed .nav-item {
        justify-content: flex-start !important;
        padding: 12px 16px !important;
      }

      .sidebar .brand {
        display: flex !important;
        margin-bottom: 24px;
      }
      
      .sidebar-footer {
        display: flex !important;
        flex-direction: column !important;
        gap: 8px !important;
        margin-top: auto !important;
        padding: 16px 0 0 0 !important;
        border-top: 1px solid var(--border);
        border-left: none !important;
      }
      
      .nav-menu {
        flex-direction: column !important;
        gap: 8px !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
      }
      
      .nav-item {
        width: 100% !important;
        flex-direction: row !important;
        padding: 12px 16px !important;
        gap: 12px !important;
        border-radius: 12px !important;
        font-size: 14px !important;
        font-weight: 600 !important;
      }

      .nav-item span {
        font-size: 14px !important;
        text-align: left !important;
      }

      .nav-item svg, .nav-item i {
        width: 20px !important;
        height: 20px !important;
        margin: 0 !important;
      }

      .nav-item.active {
        background: var(--primary-bg, rgba(99, 102, 241, 0.1)) !important;
        box-shadow: none !important;
        border-left: 4px solid var(--primary) !important;
      }
      
      /* Topbar Mobile Adjustments */
      .topbar {
        position: sticky !important; 
        top: 0 !important;
        height: auto !important;
        flex-direction: column;
        gap: 12px;
        padding: 16px !important;
        z-index: 999 !important; /* High z-index to prevent overlapping cards */
        background: var(--bg-card) !important;
        backdrop-filter: blur(24px) !important;
      }
      
      .topbar > div:first-child > button:first-child {
        display: flex !important; /* Show sidebar toggle on mobile */
      }
      
      .search-box {
        width: 100% !important;
      }
      
      .user-profile {
        width: 100%;
        justify-content: space-between;
      }

      /* Global Mobile Fixes for Overlapping and Spacing */
      * {
        box-sizing: border-box !important;
      }
      
      body, html {
        overflow-x: hidden !important;
      }
      
      .mobile-hide, .float-blob {
        display: none !important;
      }
      
      .main-content {
        padding: 8px !important;
        width: 100% !important;
        max-width: 100vw !important;
        overflow-x: hidden !important;
      }
      
      .page-container {
        padding: 16px 8px !important;
        width: 100% !important;
        max-width: 100vw !important;
      }

      /* Fix Bento Cards, Modals, and all padding/margin issues */
      .card, div[style*="padding: 32px"], div[style*="padding: 60px"], div[style*="padding: 40px"] {
        padding: 16px !important;
        margin-left: 0 !important;
        margin-right: 0 !important;
      }

      /* Force wrap on flex rows that are too wide */
      div[style*="display: flex"] {
        max-width: 100%;
      }
      
      div[style*="gap: 16px"], div[style*="gap: 24px"], .user-profile, .page-header {
        flex-wrap: wrap !important;
      }
      
      .main-content > div, .card > div, .hover-lift {
        max-width: 100%;
        min-width: 0 !important;
      }
      
      /* Dashboard Grids to Single Column */
      div[style*="display: grid"],
      div[style*="gridTemplateColumns"], 
      div[style*="grid-template-columns"],
      .stats-grid,
      .insight-grid,
      .charts-grid {
        display: flex !important;
        flex-direction: column !important;
        gap: 16px !important;
      }

      h1, h2, h3, h4, h5, h6, .brand-text {
        word-wrap: break-word;
        white-space: normal !important;
        line-height: 1.3 !important;
      }
      
      .recharts-responsive-container {
        width: 100% !important;
        min-width: 0 !important;
      }
      
      .table-wrapper, .table-container {
        overflow-x: auto;
        width: 100%;
      }

      /* Adjust FAB to sit above bottom nav */
      .fab-container {
        bottom: 90px !important;
        right: 16px !important;
      }
      
      /* Modals */
      .modal-content, .modal-box {
        width: 95% !important;
        max-width: 95% !important;
        margin: 10px auto !important;
        padding: 20px 16px !important;
      }
      
      .page-header {
        flex-direction: column;
        align-items: flex-start;
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
