import { useEffect, useState } from "react";
import api from "../api/axios";

function Purchases() {
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [purchases, setPurchases] = useState([]);

  const [form, setForm] = useState({
    base_id: "",
    equipment_type_id: "",
    quantity: "",
    purchase_date: "",
    supplier: "",
    reference_number: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
      console.error("Master data error:", error);
      setError("Unable to load base and equipment data");
    }
  };

  const loadPurchases = async () => {
    try {
      const params = {};

      if (filterEquipment) {
        params.equipment_type_id = filterEquipment;
      }

      if (filterFromDate) {
        params.from_date = filterFromDate;
      }

      if (filterToDate) {
        params.to_date = filterToDate;
      }

      const response = await api.get("/purchases", { params });

      setPurchases(response.data.purchases || []);
    } catch (error) {
      console.error("Purchase loading error:", error);

      setError(error.response?.data?.message || "Unable to load purchases");
    }
  };

  useEffect(() => {
    loadMasterData();
    loadPurchases();
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

    try {
      await api.post("/purchases", {
        base_id: Number(form.base_id),
        equipment_type_id: Number(form.equipment_type_id),
        quantity: Number(form.quantity),
        purchase_date: form.purchase_date,
        supplier: form.supplier,
        reference_number: form.reference_number,
      });

      setMessage("Purchase recorded successfully!");

      setForm({
        base_id: "",
        equipment_type_id: "",
        quantity: "",
        purchase_date: "",
        supplier: "",
        reference_number: "",
      });

      loadPurchases();
    } catch (error) {
      console.error("Purchase error:", error);

      setError(error.response?.data?.message || "Unable to record purchase");
    }
  };

  return (
    <div style={styles.page}>
      <h1>Purchases Management</h1>

      <p style={styles.subtitle}>Record and view equipment purchases</p>

      {/* PURCHASE FORM */}

      <div style={styles.formBox}>
        <h2>Record Purchase</h2>

        <form onSubmit={handleSubmit}>
          <div style={styles.formGrid}>
            <div style={styles.field}>
              <label>Base</label>

              <select
                name="base_id"
                value={form.base_id}
                onChange={handleChange}
                style={styles.input}
                required
              >
                <option value="">Select Base</option>

                {bases.map((base) => (
                  <option key={base.id} value={base.id}>
                    {base.name}
                  </option>
                ))}
              </select>
            </div>

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

            <div style={styles.field}>
              <label>Purchase Date</label>

              <input
                type="date"
                name="purchase_date"
                value={form.purchase_date}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.field}>
              <label>Supplier</label>

              <input
                type="text"
                name="supplier"
                value={form.supplier}
                onChange={handleChange}
                placeholder="Enter supplier"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label>Reference Number</label>

              <input
                type="text"
                name="reference_number"
                value={form.reference_number}
                onChange={handleChange}
                placeholder="Enter reference number"
                style={styles.input}
              />
            </div>
          </div>

          <button type="submit" style={styles.submitButton}>
            Record Purchase
          </button>
        </form>

        {message && <p style={styles.success}>{message}</p>}

        {error && <p style={styles.error}>{error}</p>}
      </div>

      {/* PURCHASE HISTORY */}

      <div style={styles.tableBox}>
        <h2>Purchase History</h2>

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
          <button onClick={loadPurchases} style={styles.applyButton}>
            Apply Filters
          </button>

          <button
            onClick={() => {
              setFilterEquipment("");
              setFilterFromDate("");
              setFilterToDate("");

              setTimeout(() => {
                loadPurchases();
              }, 0);
            }}
            style={styles.clearButton}
          >
            Clear
          </button>
        </div>

        {purchases.length === 0 ? (
          <p>No purchases found.</p>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Base</th>
                  <th>Equipment</th>
                  <th>Quantity</th>
                  <th>Date</th>
                  <th>Supplier</th>
                  <th>Reference</th>
                </tr>
              </thead>

              <tbody>
                {purchases.map((purchase) => (
                  <tr key={purchase.id}>
                    <td>{purchase.id}</td>

                    <td>{purchase.base_name}</td>

                    <td>{purchase.equipment_name}</td>

                    <td>{purchase.quantity}</td>

                    <td>{purchase.purchase_date}</td>

                    <td>{purchase.supplier || "-"}</td>

                    <td>{purchase.reference_number || "-"}</td>
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

export default Purchases;
