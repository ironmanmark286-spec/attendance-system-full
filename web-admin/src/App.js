import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

function PrivateRoute({ children }) {
  return localStorage.getItem("token") ? children : <Navigate to="/" />;
}

export default function App() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  useEffect(() => {
    document.body.classList.remove("theme-dark", "theme-light");
    document.body.classList.add(theme === "light" ? "theme-light" : "theme-dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login theme={theme} onToggleTheme={toggleTheme} />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard theme={theme} onToggleTheme={toggleTheme} />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
