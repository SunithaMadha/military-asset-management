import { useEffect, useState } from "react";
import api from "../api/axios";

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);

  const [baseId, setBaseId] = useState("");
  const [equipmentTypeId, setEquipmentTypeId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [error, setError] = useState("");
  const [showMovement, setShowMovement] = useState(false);
  const [movementDetails, setMovementDetails] = useState(null);
  const [movementLoading, setMovementLoading] = useState(false);

  const fetchMasterData = async () => {
    try {
      const basesResponse = await api.get("/bases");

      const equipmentResponse = await api.get("/equipment-types");

      setBases(basesResponse.data.bases || []);
      setEquipmentTypes(equipmentResponse.data.equipment_types || []);
    } catch (error) {
      console.error("Master data error:", error);
      setError("Unable to load filter data");
    }
  };

  const fetchDashboard = async () => {
    try {
      setError("");

      const params = {};

      if (baseId) {
        params.base_id = baseId;
      }

      if (equipmentTypeId) {
        params.equipment_type_id = equipmentTypeId;
      }

      if (fromDate) {
        params.from_date = fromDate;
      }

      if (toDate) {
        params.to_date = toDate;
      }

      const response = await api.get("/dashboard", { params });

      console.log("Dashboard API Response:", response.data);

      setDashboard(response.data.dashboard || response.data);
    } catch (error) {
      console.error("Dashboard error:", error);

      setError(error.response?.data?.message || "Unable to load dashboard");
    }
  };

  const fetchMovementDetails = async () => {
    try {
      setMovementLoading(true);

      const params = {};

      if (baseId) {
        params.base_id = baseId;
      }

      if (equipmentTypeId) {
        params.equipment_type_id = equipmentTypeId;
      }

      if (fromDate) {
        params.from_date = fromDate;
      }

      if (toDate) {
        params.to_date = toDate;
      }

      console.log("Movement Filters:", params);

      const response = await api.get("/dashboard/net-movement", { params });

      console.log("Net Movement API Response:", response.data);

      setMovementDetails(response.data);
      setShowMovement(true);
    } catch (error) {
      console.error("Net movement error:", error);

      alert(
        error.response?.data?.message || "Unable to load net movement details",
      );
    } finally {
      setMovementLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
    fetchDashboard();
  }, []);

  const handleApplyFilters = () => {
    fetchDashboard();
  };

  const handleClearFilters = () => {
    setBaseId("");
    setEquipmentTypeId("");
    setFromDate("");
    setToDate("");

    setTimeout(() => {
      fetchDashboard();
    }, 0);
  };

  if (error) {
    return (
      <div style={styles.page}>
        <h2>{error}</h2>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div style={styles.page}>
        <h2>Loading dashboard...</h2>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Military Asset Management</h1>

      <p style={styles.subtitle}>Dashboard</p>

      {/* FILTERS */}

      <div style={styles.filterBox}>
        <h2 style={styles.filterTitle}>Dashboard Filters</h2>

        <div style={styles.filters}>
          <div style={styles.filterItem}>
            <label>From Date</label>

            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.filterItem}>
            <label>To Date</label>

            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.filterItem}>
            <label>Base</label>

            <select
              value={baseId}
              onChange={(e) => setBaseId(e.target.value)}
              style={styles.input}
            >
              <option value="">All Bases</option>

              {bases.map((base) => (
                <option key={base.id} value={base.id}>
                  {base.name}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.filterItem}>
            <label>Equipment Type</label>

            <select
              value={equipmentTypeId}
              onChange={(e) => setEquipmentTypeId(e.target.value)}
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

        <div style={styles.buttonContainer}>
          <button onClick={handleApplyFilters} style={styles.applyButton}>
            Apply Filters
          </button>

          <button onClick={handleClearFilters} style={styles.clearButton}>
            Clear
          </button>
        </div>
      </div>

      {/* DASHBOARD CARDS */}

      <div style={styles.cards}>
        <div style={styles.card}>
          <h3>Opening Balance</h3>
          <h2>{dashboard.opening_balance ?? 0}</h2>
        </div>

        <div style={styles.card}>
          <h3>Closing Balance</h3>
          <h2>{dashboard.closing_balance ?? 0}</h2>
        </div>

        <div
          style={{
            ...styles.card,
            cursor: "pointer",
          }}
          onClick={fetchMovementDetails}
        >
          <h3>Net Movement</h3>

          <h2>{dashboard.net_movement ?? 0}</h2>

          <p style={styles.clickText}>Click to view details</p>
        </div>

        <div style={styles.card}>
          <h3>Assigned</h3>

          <h2>{dashboard.assigned ?? 0}</h2>
        </div>

        <div style={styles.card}>
          <h3>Expended</h3>

          <h2>{dashboard.expended ?? 0}</h2>
        </div>
      </div>

      {/* NET MOVEMENT MODAL */}

      {showMovement && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2>Net Movement Details</h2>

              <button
                onClick={() => setShowMovement(false)}
                style={styles.closeButton}
              >
                ✕
              </button>
            </div>

            {movementLoading ? (
              <p>Loading details...</p>
            ) : movementDetails ? (
              <>
                {/* SUMMARY */}

                <div style={styles.movementSummary}>
                  <div style={styles.summaryItem}>
                    <span>Purchases</span>

                    <strong>{movementDetails.summary?.purchases ?? 0}</strong>
                  </div>

                  <div style={styles.summaryItem}>
                    <span>Transfer In</span>

                    <strong>{movementDetails.summary?.transfer_in ?? 0}</strong>
                  </div>

                  <div style={styles.summaryItem}>
                    <span>Transfer Out</span>

                    <strong>
                      {movementDetails.summary?.transfer_out ?? 0}
                    </strong>
                  </div>
                </div>

                {/* PURCHASES */}

                <div style={styles.detailSection}>
                  <h3>Purchases</h3>

                  {movementDetails.purchases?.length > 0 ? (
                    movementDetails.purchases.map((purchase) => (
                      <div key={purchase.id} style={styles.transactionCard}>
                        <div>
                          <strong>{purchase.equipment_name}</strong>

                          <p>Quantity: {purchase.quantity}</p>

                          <p>Date: {purchase.purchase_date}</p>

                          {purchase.supplier && (
                            <p>Supplier: {purchase.supplier}</p>
                          )}

                          {purchase.reference_number && (
                            <p>Reference: {purchase.reference_number}</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={styles.noData}>No purchases found.</p>
                  )}
                </div>

                {/* TRANSFER IN */}

                <div style={styles.detailSection}>
                  <h3>Transfer In</h3>

                  {movementDetails.transfer_in?.length > 0 ? (
                    movementDetails.transfer_in.map((transfer) => (
                      <div key={transfer.id} style={styles.transactionCard}>
                        <strong>{transfer.equipment_name}</strong>

                        <p>From: {transfer.from_base_name}</p>

                        <p>To: {transfer.to_base_name}</p>

                        <p>Quantity: {transfer.quantity}</p>

                        <p>Status: {transfer.status}</p>
                      </div>
                    ))
                  ) : (
                    <p style={styles.noData}>No transfer-in records found.</p>
                  )}
                </div>

                {/* TRANSFER OUT */}

                <div style={styles.detailSection}>
                  <h3>Transfer Out</h3>

                  {movementDetails.transfer_out?.length > 0 ? (
                    movementDetails.transfer_out.map((transfer) => (
                      <div key={transfer.id} style={styles.transactionCard}>
                        <strong>{transfer.equipment_name}</strong>

                        <p>From: {transfer.from_base_name}</p>

                        <p>To: {transfer.to_base_name}</p>

                        <p>Quantity: {transfer.quantity}</p>

                        <p>Status: {transfer.status}</p>
                      </div>
                    ))
                  ) : (
                    <p style={styles.noData}>No transfer-out records found.</p>
                  )}
                </div>

                {/* TOTAL */}

                <div style={styles.totalMovement}>
                  <span>Net Movement</span>

                  <strong>
                    {(movementDetails.summary?.purchases ?? 0) +
                      (movementDetails.summary?.transfer_in ?? 0) -
                      (movementDetails.summary?.transfer_out ?? 0)}
                  </strong>
                </div>
              </>
            ) : (
              <p>No movement details found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: "40px",
    minHeight: "100vh",
    backgroundColor: "#f4f6f8",
  },

  title: {
    textAlign: "center",
    marginBottom: "5px",
  },

  subtitle: {
    textAlign: "center",
    color: "#6b7280",
    fontSize: "18px",
    marginBottom: "30px",
  },

  filterBox: {
    backgroundColor: "#ffffff",
    padding: "25px",
    borderRadius: "10px",
    marginBottom: "30px",
    boxShadow: "0 3px 12px rgba(0,0,0,0.1)",
  },

  filterTitle: {
    marginTop: "0",
    marginBottom: "20px",
  },

  filters: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
  },

  filterItem: {
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

  buttonContainer: {
    display: "flex",
    gap: "12px",
    marginTop: "20px",
  },

  applyButton: {
    padding: "11px 22px",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#2563eb",
    color: "white",
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

  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
  },

  card: {
    backgroundColor: "#ffffff",
    padding: "25px",
    borderRadius: "10px",
    boxShadow: "0 3px 12px rgba(0,0,0,0.1)",
    textAlign: "center",
  },

  clickText: {
    marginTop: "8px",
    fontSize: "13px",
    color: "#2563eb",
  },

  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },

  modal: {
    width: "600px",
    maxWidth: "90%",
    maxHeight: "85vh",
    overflowY: "auto",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "25px",
    boxShadow: "0 5px 25px rgba(0,0,0,0.3)",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: "15px",
    marginBottom: "20px",
  },

  closeButton: {
    border: "none",
    backgroundColor: "transparent",
    fontSize: "22px",
    cursor: "pointer",
  },

  movementSummary: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "15px",
  },

  summaryItem: {
    backgroundColor: "#f4f6f8",
    padding: "18px",
    borderRadius: "8px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  totalMovement: {
    marginTop: "20px",
    padding: "18px",
    backgroundColor: "#eef2ff",
    borderRadius: "8px",
    display: "flex",
    justifyContent: "space-between",
    fontSize: "18px",
  },

  detailSection: {
    marginTop: "25px",
  },

  transactionCard: {
    backgroundColor: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "15px",
    marginBottom: "10px",
  },

  noData: {
    color: "#6b7280",
    fontStyle: "italic",
  },
};

export default Dashboard;
