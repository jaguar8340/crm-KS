import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Customers from "@/pages/Customers";
import CustomerDetails from "@/pages/CustomerDetails";
import Vehicles from "@/pages/Vehicles";
import Employees from "@/pages/Employees";
import Tasks from "@/pages/Tasks";
import Users from "@/pages/Users";
import { Toaster } from "@/components/ui/sonner";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    setUser(userData);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Laden...</div>;
  }

  return (
    <div className="App">
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />}
          />
          <Route
            path="/"
            element={user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
          />
          <Route
            path="/customers"
            element={user ? <Customers user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
          />
          <Route
            path="/customers/:id"
            element={user ? <CustomerDetails user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
          />
          <Route
            path="/vehicles"
            element={user ? <Vehicles user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
          />
          <Route
            path="/employees"
            element={user ? <Employees user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
          />
          <Route
            path="/tasks"
            element={user ? <Tasks user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
          />
          <Route
            path="/users"
            element={user && user.role === "admin" ? <Users user={user} onLogout={handleLogout} /> : <Navigate to="/" />}
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
