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
      /* Map legacy/global variable names to the theme variables used in styles-pro.css */
      --bg-app: var(--bg-secondary);
      --bg-card: var(--bg-primary);
      --border: var(--border-color);
    }
    
    body {
      background-color: var(--bg-app);
      background-image: 
        radial-gradient(circle at 0% 0%, rgba(99, 102, 241, 0.08) 0%, transparent 40%), 
        radial-gradient(circle at 100% 100%, rgba(168, 85, 247, 0.08) 0%, transparent 40%) !important;
      background-attachment: fixed;
      letter-spacing: -0.01em;
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
  const [animationsEnabled, setAnimationsEnabled] = useState(() => {
    const v = localStorage.getItem('animationsEnabled');
    return v === null ? true : v === 'true';
  });

  useEffect(() => {
    // support multiple class-name conventions used across stylesheets
    // remove any existing theme classes then add both variants for compatibility
    document.body.classList.remove("dark-mode", "light-mode", "theme-dark", "theme-light");
    if (theme === "light") {
      document.body.classList.add("light-mode");
      document.body.classList.add("theme-light");
    } else {
      document.body.classList.add("dark-mode");
      document.body.classList.add("theme-dark");
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
