import React, { useEffect, useState } from "react";
import api from "../api/axios";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [bases, setBases] = useState([]);

  const [userForm, setUserForm] = useState({
    username: "",
    password: "",
    full_name: "",
    role: "",
    base_id: "",
  });

  useEffect(() => {
    loadUsers();
    loadBases();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await api.get("/users");

      setUsers(response.data.users || []);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const loadBases = async () => {
    try {
      const response = await api.get("/bases");

      setBases(response.data.bases || []);
    } catch (error) {
      console.error("Error loading bases:", error);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post("/users", {
        username: userForm.username,
        password: userForm.password,
        full_name: userForm.full_name,
        role: userForm.role,
        base_id: userForm.base_id ? Number(userForm.base_id) : null,
      });

      alert(response.data.message || "User created successfully");

      setUserForm({
        username: "",
        password: "",
        full_name: "",
        role: "",
        base_id: "",
      });

      loadUsers();
    } catch (error) {
      console.error("Create user error:", error);

      alert(error.response?.data?.message || "Failed to create user");
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = !user.is_active;

    const action = newStatus ? "activate" : "deactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} user "${user.username}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await api.put(`/users/${user.id}/status`, {
        is_active: newStatus,
      });

      alert(response.data.message || `User ${action}d successfully`);

      loadUsers();
    } catch (error) {
      console.error("User status update error:", error);

      console.log("Status Code:", error.response?.status);

      console.log("Backend Response:", error.response?.data);

      alert(
        error.response?.data?.message ||
          `Request failed with status ${error.response?.status || "unknown"}`,
      );
    }
  };

  return (
    <div style={styles.container}>
      <h1>User Management</h1>

      <form style={styles.section} onSubmit={handleCreateUser}>
        <h2>Create User</h2>

        <div style={styles.formGrid}>
          <div style={styles.formField}>
            <label>Username</label>

            <input
              type="text"
              placeholder="Enter username"
              value={userForm.username}
              onChange={(e) =>
                setUserForm({
                  ...userForm,
                  username: e.target.value,
                })
              }
              required
            />
          </div>

          <div style={styles.formField}>
            <label>Password</label>

            <input
              type="password"
              placeholder="Enter password"
              value={userForm.password}
              onChange={(e) =>
                setUserForm({
                  ...userForm,
                  password: e.target.value,
                })
              }
              required
            />
          </div>

          <div style={styles.formField}>
            <label>Full Name</label>

            <input
              type="text"
              placeholder="Enter full name"
              value={userForm.full_name}
              onChange={(e) =>
                setUserForm({
                  ...userForm,
                  full_name: e.target.value,
                })
              }
            />
          </div>

          <div style={styles.formField}>
            <label>Role</label>

            <select
              value={userForm.role}
              onChange={(e) =>
                setUserForm({
                  ...userForm,
                  role: e.target.value,
                  base_id: "",
                })
              }
              required
            >
              <option value="">Select Role</option>
              <option value="ADMIN">Admin</option>
              <option value="BASE_COMMANDER">Base Commander</option>
              <option value="LOGISTICS_OFFICER">Logistics Officer</option>
            </select>
          </div>

          <div style={styles.formField}>
            <label>Base</label>

            <select
              value={userForm.base_id}
              onChange={(e) =>
                setUserForm({
                  ...userForm,
                  base_id: e.target.value,
                })
              }
            >
              <option value="">Select Base</option>

              {bases.map((base) => (
                <option key={base.id} value={base.id}>
                  {base.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" style={styles.primaryButton}>
          Create User
        </button>
      </form>

      <div style={styles.section}>
        <h2>User List</h2>

        <p>
          Total Users: <strong>{users.length}</strong>
        </p>

        {users.length > 0 ? (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Username</th>
                  <th style={styles.th}>Full Name</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Base</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Created At</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td style={styles.td}>{user.id}</td>

                    <td style={styles.td}>{user.username}</td>

                    <td style={styles.td}>{user.full_name || "-"}</td>

                    <td style={styles.td}>{user.role}</td>

                    <td style={styles.td}>{user.base_name || "All Bases"}</td>

                    <td style={styles.td}>
                      {user.is_active ? "Active" : "Inactive"}
                    </td>

                    <td style={styles.td}>
                      {user.created_at
                        ? new Date(user.created_at).toLocaleString()
                        : "-"}
                    </td>
                    <td style={styles.td}>
                      <button
                        onClick={() => handleToggleStatus(user)}
                        style={
                          user.is_active
                            ? styles.deactivateButton
                            : styles.activateButton
                        }
                      >
                        {user.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={styles.noData}>No users found.</p>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "30px",
    maxWidth: "1200px",
    margin: "0 auto",
  },

  section: {
    backgroundColor: "#ffffff",
    padding: "25px",
    marginTop: "25px",
    borderRadius: "10px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px",
    marginTop: "20px",
  },

  formField: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  primaryButton: {
    marginTop: "25px",
    padding: "12px 24px",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "15px",
  },
  deactivateButton: {
    padding: "8px 14px",
    border: "none",
    borderRadius: "5px",
    backgroundColor: "#dc2626",
    color: "#ffffff",
    cursor: "pointer",
  },

  activateButton: {
    padding: "8px 14px",
    border: "none",
    borderRadius: "5px",
    backgroundColor: "#16a34a",
    color: "#ffffff",
    cursor: "pointer",
  },
};

export default UserManagement;
