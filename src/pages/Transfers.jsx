import { useEffect, useState } from "react";
import api from "../api/axios";

function Transfers() {
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [transfers, setTransfers] = useState([]);

  const [form, setForm] = useState({
    from_base_id: "",
    to_base_id: "",
    equipment_type_id: "",
    quantity: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [filterFromBase, setFilterFromBase] = useState("");
  const [filterToBase, setFilterToBase] = useState("");
  const [filterEquipment, setFilterEquipment] = useState("");
  const [filterFromDate, setFilterFromDate] = useState("");
  const [filterToDate, setFilterToDate] = useState("");

  const loadMasterData = async () => {
    try {
      const basesResponse = await api.get("/bases");

      const equipmentResponse = await api.get("/equipment-types");

      setBases(basesResponse.data.bases || []);

      setEquipmentTypes(equipmentResponse.data.equipment_types || []);
    } catch (error) {
      console.error(error);

      setError("Unable to load base and equipment data");
    }
  };

  const loadTransfers = async () => {
    try {
      const params = {};

      if (filterFromBase) {
        params.from_base_id = filterFromBase;
      }

      if (filterToBase) {
        params.to_base_id = filterToBase;
      }

      if (filterEquipment) {
        params.equipment_type_id = filterEquipment;
      }

      if (filterFromDate) {
        params.from_date = filterFromDate;
      }

      if (filterToDate) {
        params.to_date = filterToDate;
      }

      const response = await api.get("/transfers", {
        params,
      });

      console.log(
        "Transfers API Records:",
        JSON.stringify(response.data.transfers, null, 2),
      );

      setTransfers(response.data.transfers || []);
    } catch (error) {
      console.error(error);

      setError(error.response?.data?.message || "Unable to load transfers");
    }
  };

  useEffect(() => {
    loadMasterData();
    loadTransfers();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (form.from_base_id === form.to_base_id) {
      setError("From Base and To Base must be different");

      return;
    }

    try {
      await api.post("/transfers", {
        from_base_id: Number(form.from_base_id),
        to_base_id: Number(form.to_base_id),
        equipment_type_id: Number(form.equipment_type_id),
        quantity: Number(form.quantity),
      });

      setMessage("Transfer recorded successfully!");

      setForm({
        from_base_id: "",
        to_base_id: "",
        equipment_type_id: "",
        quantity: "",
      });

      loadTransfers();
    } catch (error) {
      console.error(error);

      setError(error.response?.data?.message || "Unable to record transfer");
    }
  };

  return (
    <div style={styles.page}>
      <h1>Transfer Management</h1>

      <p style={styles.subtitle}>Transfer equipment between bases</p>

      {/* TRANSFER FORM */}

      <div style={styles.formBox}>
        <h2>Record Transfer</h2>

        <form onSubmit={handleSubmit}>
          <div style={styles.formGrid}>
            {/* FROM BASE */}

            <div style={styles.field}>
              <label>From Base</label>

              <select
                name="from_base_id"
                value={form.from_base_id}
                onChange={handleChange}
                style={styles.input}
                required
              >
                <option value="">Select Source Base</option>

                {bases.map((base) => (
                  <option key={base.id} value={base.id}>
                    {base.name}
                  </option>
                ))}
              </select>
            </div>

            {/* TO BASE */}

            <div style={styles.field}>
              <label>To Base</label>

              <select
                name="to_base_id"
                value={form.to_base_id}
                onChange={handleChange}
                style={styles.input}
                required
              >
                <option value="">Select Destination Base</option>

                {bases.map((base) => (
                  <option key={base.id} value={base.id}>
                    {base.name}
                  </option>
                ))}
              </select>
            </div>

            {/* EQUIPMENT */}

            <div style={styles.field}>
              <label>Equipment Type</label>

              <select
                name="equipment_type_id"
                value={form.equipment_type_id}
                onChange={handleChange}
                style={styles.input}
                required
              >
                <option value="">Select Equipment</option>

                {equipmentTypes.map((equipment) => (
                  <option key={equipment.id} value={equipment.id}>
                    {equipment.name}
                  </option>
                ))}
              </select>
            </div>

            {/* QUANTITY */}

            <div style={styles.field}>
              <label>Quantity</label>

              <input
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                placeholder="Enter quantity"
                min="1"
                style={styles.input}
                required
              />
            </div>
          </div>

          <button type="submit" style={styles.submitButton}>
            Record Transfer
          </button>
        </form>

        {message && <p style={styles.success}>{message}</p>}

        {error && <p style={styles.error}>{error}</p>}
      </div>

      {/* TRANSFER HISTORY */}

      <div style={styles.tableBox}>
        <h2>Transfer History</h2>

        <div style={styles.filterBox}>
          <div style={styles.filterField}>
            <label>From Date</label>

            <input
              type="date"
              value={filterFromDate}
              onChange={(e) => setFilterFromDate(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.filterField}>
            <label>To Date</label>

            <input
              type="date"
              value={filterToDate}
              onChange={(e) => setFilterToDate(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.filterField}>
            <label>From Base</label>

            <select
              value={filterFromBase}
              onChange={(e) => setFilterFromBase(e.target.value)}
              style={styles.input}
            >
              <option value="">All Source Bases</option>

              {bases.map((base) => (
                <option key={base.id} value={base.id}>
                  {base.name}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.filterField}>
            <label>To Base</label>

            <select
              value={filterToBase}
              onChange={(e) => setFilterToBase(e.target.value)}
              style={styles.input}
            >
              <option value="">All Destination Bases</option>

              {bases.map((base) => (
                <option key={base.id} value={base.id}>
                  {base.name}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.filterField}>
            <label>Equipment Type</label>

            <select
              value={filterEquipment}
              onChange={(e) => setFilterEquipment(e.target.value)}
              style={styles.input}
            >
              <option value="">All Equipment</option>

              {equipmentTypes.map((equipment) => (
                <option key={equipment.id} value={equipment.id}>
                  {equipment.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={styles.filterButtons}>
          <button onClick={() => loadTransfers()} style={styles.applyButton}>
            Apply Filters
          </button>

          <button
            onClick={() => {
              setFilterFromBase("");
              setFilterToBase("");
              setFilterEquipment("");
              setFilterFromDate("");
              setFilterToDate("");

              setTimeout(() => {
                loadTransfers();
              }, 0);
            }}
            style={styles.clearButton}
          >
            Clear
          </button>
        </div>

        {transfers.length === 0 ? (
          <p>No transfers found.</p>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>From Base</th>
                  <th>To Base</th>
                  <th>Equipment</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Transfer Date</th>
                </tr>
              </thead>

              <tbody>
                {transfers.map((transfer) => (
                  <tr key={transfer.id}>
                    <td>{transfer.id}</td>
                    <td>{transfer.from_base}</td>
                    <td>{transfer.to_base}</td>
                    <td>{transfer.equipment_name}</td>
                    <td>{transfer.quantity}</td>
                    <td>{transfer.status}</td>
                    <td>{transfer.transfer_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  filterBox: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    marginTop: "20px",
  },

  filterField: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  filterButtons: {
    display: "flex",
    gap: "12px",
    marginTop: "20px",
    marginBottom: "20px",
  },

  applyButton: {
    padding: "11px 22px",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "15px",
  },

  clearButton: {
    padding: "11px 22px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    backgroundColor: "#ffffff",
    cursor: "pointer",
    fontSize: "15px",
  },

  page: {
    minHeight: "100vh",
    padding: "40px",
    backgroundColor: "#f4f6f8",
  },

  subtitle: {
    color: "#6b7280",
    marginBottom: "30px",
  },

  formBox: {
    backgroundColor: "#ffffff",
    padding: "30px",
    borderRadius: "10px",
    boxShadow: "0 3px 12px rgba(0,0,0,0.1)",
    marginBottom: "30px",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  input: {
    padding: "11px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
  },

  submitButton: {
    marginTop: "25px",
    padding: "12px 24px",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontSize: "15px",
    cursor: "pointer",
  },

  success: {
    marginTop: "15px",
    color: "#15803d",
  },

  error: {
    marginTop: "15px",
    color: "#dc2626",
  },

  tableBox: {
    backgroundColor: "#ffffff",
    padding: "30px",
    borderRadius: "10px",
    boxShadow: "0 3px 12px rgba(0,0,0,0.1)",
  },

  tableContainer: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "20px",
  },
};

export default Transfers;
