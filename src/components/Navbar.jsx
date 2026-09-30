import React from "react";
import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    navigate("/");
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.logo}>Military Asset Management</div>

      <div style={styles.links}>
        <Link to="/dashboard" style={styles.link}>
          Dashboard
        </Link>

        <Link to="/purchases" style={styles.link}>
          Purchases
        </Link>

        <Link to="/transfers" style={styles.link}>
          Transfers
        </Link>

        <Link to="/assignments-expenditures" style={styles.link}>
          Assignments & Expenditures
        </Link>

        {user.role === "ADMIN" && (
          <Link to="/users" style={styles.link}>
            User Management
          </Link>
        )}

        <button onClick={handleLogout} style={styles.logoutButton}>
          Logout
        </button>
      </div>
    </nav>
  );
}

const styles = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 25px",
    backgroundColor: "#1f2937",
    color: "#ffffff",
    gap: "20px",
    flexWrap: "wrap",
  },

  logo: {
    fontSize: "20px",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },

  links: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    flexWrap: "wrap",
  },

  link: {
    color: "#ffffff",
    textDecoration: "none",
    fontSize: "15px",
  },

  logoutButton: {
    padding: "8px 16px",
    border: "none",
    borderRadius: "5px",
    backgroundColor: "#dc2626",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "14px",
  },
};

export default Navbar;
