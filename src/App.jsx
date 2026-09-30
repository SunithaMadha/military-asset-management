import { useState } from "react";
import api from "./api/axios";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Purchases from "./pages/Purchases";
import Transfers from "./pages/Transfers";
import AssignmentsExpenditures from "./pages/AssignmentsExpenditures";
import Navbar from "./components/Navbar";
import UserManagement from "./pages/UserManagement";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setMessage("");

    try {
      const response = await api.post("/auth/login", {
        username,
        password,
      });

      localStorage.setItem("access_token", response.data.access_token);

      localStorage.setItem("user", JSON.stringify(response.data.user));

      // Open dashboard after successful login
      window.location.href = "/dashboard";
    } catch (error) {
      console.error(error);

      if (error.response) {
        setMessage(error.response.data.message || "Login failed");
      } else {
        setMessage("Unable to connect to server");
      }
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.loginBox}>
        <h1 style={styles.title}>Military Asset Management</h1>

        <p style={styles.subtitle}>Secure Management System</p>

        <form onSubmit={handleLogin}>
          <label style={styles.label}>Username</label>

          <input
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
            required
          />

          <label style={styles.label}>Password</label>

          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />

          <button type="submit" style={styles.button}>
            Login
          </button>
        </form>

        {message && <p style={styles.message}>{message}</p>}
      </div>
    </div>
  );
}

function App() {
  const token = localStorage.getItem("access_token");

  return (
    <BrowserRouter>
      {localStorage.getItem("access_token") && <Navbar />}

      <Routes>
        <Route
          path="/"
          element={token ? <Navigate to="/dashboard" /> : <Login />}
        />

        <Route
          path="/dashboard"
          element={token ? <Dashboard /> : <Navigate to="/" />}
        />
        <Route
          path="/purchases"
          element={token ? <Purchases /> : <Navigate to="/" />}
        />
        <Route
          path="/transfers"
          element={token ? <Transfers /> : <Navigate to="/" />}
        />
        <Route
          path="/assignments-expenditures"
          element={
            localStorage.getItem("access_token") ? (
              <AssignmentsExpenditures />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/users"
          element={
            localStorage.getItem("access_token") &&
            JSON.parse(localStorage.getItem("user"))?.role === "ADMIN" ? (
              <UserManagement />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f4f6f8",
  },

  loginBox: {
    width: "400px",
    padding: "40px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
  },

  title: {
    textAlign: "center",
    marginBottom: "8px",
    color: "#1f2937",
  },

  subtitle: {
    textAlign: "center",
    marginBottom: "30px",
    color: "#6b7280",
  },

  label: {
    display: "block",
    marginBottom: "6px",
    marginTop: "15px",
    fontWeight: "600",
  },

  input: {
    width: "100%",
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    boxSizing: "border-box",
  },

  button: {
    width: "100%",
    marginTop: "25px",
    padding: "12px",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontSize: "16px",
    cursor: "pointer",
  },

  message: {
    textAlign: "center",
    marginTop: "20px",
    color: "#2563eb",
  },
};

export default App;
