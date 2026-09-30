import React, { useEffect, useState } from "react";
import api from "../api/axios";

function AssignmentsExpenditures() {
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);

  const [assignments, setAssignments] = useState([]);
  const [expenditures, setExpenditures] = useState([]);

  const [expenditureFilterBase, setExpenditureFilterBase] = useState("");
  const [expenditureFilterEquipment, setExpenditureFilterEquipment] =
    useState("");
  const [expenditureFilterFromDate, setExpenditureFilterFromDate] =
    useState("");
  const [expenditureFilterToDate, setExpenditureFilterToDate] = useState("");

  const [filterBase, setFilterBase] = useState("");
  const [filterEquipment, setFilterEquipment] = useState("");
  const [filterFromDate, setFilterFromDate] = useState("");
  const [filterToDate, setFilterToDate] = useState("");

  const [assignmentForm, setAssignmentForm] = useState({
    base_id: "",
    equipment_type_id: "",
    personnel_name: "",
    personnel_id: "",
    quantity: "",
    assigned_date: "",
  });

  const [expenditureForm, setExpenditureForm] = useState({
    base_id: "",
    equipment_type_id: "",
    quantity: "",
    expenditure_date: "",
    reason: "",
  });

  useEffect(() => {
    loadMasterData();
    loadAssignments();
    loadExpenditures();
  }, []);

  const loadMasterData = async () => {
    try {
      const [basesResponse, equipmentResponse] = await Promise.all([
        api.get("/bases"),
        api.get("/equipment-types"),
      ]);

      setBases(basesResponse.data.bases || []);
      setEquipmentTypes(equipmentResponse.data.equipment_types || []);
    } catch (error) {
      console.error("Error loading master data:", error);
    }
  };

  const loadAssignments = async () => {
    try {
      const params = {};

      if (filterBase) {
        params.base_id = filterBase;
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

      const response = await api.get("/assignments", {
        params,
      });

      console.log(
        "Assignments API Records:",
        JSON.stringify(response.data.assignments, null, 2),
      );

      setAssignments(response.data.assignments || []);
    } catch (error) {
      console.error("Error loading assignments:", error);
    }
  };

  const loadExpenditures = async () => {
    try {
      const params = {};

      if (expenditureFilterBase) {
        params.base_id = expenditureFilterBase;
      }

      if (expenditureFilterEquipment) {
        params.equipment_type_id = expenditureFilterEquipment;
      }

      if (expenditureFilterFromDate) {
        params.from_date = expenditureFilterFromDate;
      }

      if (expenditureFilterToDate) {
        params.to_date = expenditureFilterToDate;
      }

      const response = await api.get("/expenditures", {
        params,
      });

      console.log(
        "Expenditures API Records:",
        JSON.stringify(response.data.expenditures, null, 2),
      );

      setExpenditures(response.data.expenditures || []);
    } catch (error) {
      console.error("Error loading expenditures:", error);
    }
  };

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post("/assignments", {
        base_id: Number(assignmentForm.base_id),
        equipment_type_id: Number(assignmentForm.equipment_type_id),
        personnel_name: assignmentForm.personnel_name,
        personnel_id: assignmentForm.personnel_id,
        quantity: Number(assignmentForm.quantity),
        assigned_date: assignmentForm.assigned_date,
      });

      alert(response.data.message || "Assignment created successfully");

      setAssignmentForm({
        base_id: "",
        equipment_type_id: "",
        personnel_name: "",
        personnel_id: "",
        quantity: "",
        assigned_date: "",
      });

      loadAssignments();
    } catch (error) {
      console.error("Assignment error:", error);

      alert(error.response?.data?.message || "Failed to create assignment");
    }
  };

  const handleExpenditureSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post("/expenditures", {
        base_id: Number(expenditureForm.base_id),
        equipment_type_id: Number(expenditureForm.equipment_type_id),
        quantity: Number(expenditureForm.quantity),
        expenditure_date: expenditureForm.expenditure_date,
        reason: expenditureForm.reason,
      });

      alert(response.data.message || "Expenditure recorded successfully");

      setExpenditureForm({
        base_id: "",
        equipment_type_id: "",
        quantity: "",
        expenditure_date: "",
        reason: "",
      });

      loadExpenditures();
    } catch (error) {
      console.error("Expenditure error:", error);

      alert(error.response?.data?.message || "Failed to record expenditure");
    }
  };

  return (
    <div style={styles.container}>
      <h1>Assignments & Expenditures</h1>

      <form style={styles.section} onSubmit={handleAssignmentSubmit}>
        <h2>Assignment Management</h2>

        <div style={styles.formGrid}>
          <div style={styles.formField}>
            <label>Base</label>

            <select
              value={assignmentForm.base_id}
              onChange={(e) =>
                setAssignmentForm({
                  ...assignmentForm,
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

          <div style={styles.formField}>
            <label>Equipment Type</label>

            <select
              value={assignmentForm.equipment_type_id}
              onChange={(e) =>
                setAssignmentForm({
                  ...assignmentForm,
                  equipment_type_id: e.target.value,
                })
              }
            >
              <option value="">Select Equipment</option>

              {equipmentTypes.map((equipment) => (
                <option key={equipment.id} value={equipment.id}>
                  {equipment.name}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formField}>
            <label>Personnel Name</label>

            <input
              type="text"
              placeholder="Enter personnel name"
              value={assignmentForm.personnel_name}
              onChange={(e) =>
                setAssignmentForm({
                  ...assignmentForm,
                  personnel_name: e.target.value,
                })
              }
            />
          </div>

          <div style={styles.formField}>
            <label>Personnel ID</label>

            <input
              type="text"
              placeholder="Enter personnel ID"
              value={assignmentForm.personnel_id}
              onChange={(e) =>
                setAssignmentForm({
                  ...assignmentForm,
                  personnel_id: e.target.value,
                })
              }
            />
          </div>

          <div style={styles.formField}>
            <label>Quantity</label>

            <input
              type="number"
              min="1"
              placeholder="Enter quantity"
              value={assignmentForm.quantity}
              onChange={(e) =>
                setAssignmentForm({
                  ...assignmentForm,
                  quantity: e.target.value,
                })
              }
            />
          </div>

          <div style={styles.formField}>
            <label>Assignment Date</label>

            <input
              type="date"
              value={assignmentForm.assigned_date}
              onChange={(e) =>
                setAssignmentForm({
                  ...assignmentForm,
                  assigned_date: e.target.value,
                })
              }
            />
          </div>
        </div>

        <button type="submit" style={styles.primaryButton}>
          Assign Equipment
        </button>
      </form>

      <div style={styles.section}>
        <h2>Assignment History</h2>

        <p>
          Total Assignments: <strong>{assignments.length}</strong>
        </p>

        <div style={styles.filterBox}>
          <div style={styles.filterField}>
            <label>From Date</label>

            <input
              type="date"
              value={filterFromDate}
              onChange={(e) => setFilterFromDate(e.target.value)}
            />
          </div>

          <div style={styles.filterField}>
            <label>To Date</label>

            <input
              type="date"
              value={filterToDate}
              onChange={(e) => setFilterToDate(e.target.value)}
            />
          </div>

          <div style={styles.filterField}>
            <label>Base</label>

            <select
              value={filterBase}
              onChange={(e) => setFilterBase(e.target.value)}
            >
              <option value="">All Bases</option>

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
          <button
            type="button"
            style={styles.applyButton}
            onClick={loadAssignments}
          >
            Apply Filters
          </button>

          <button
            type="button"
            style={styles.clearButton}
            onClick={() => {
              setFilterBase("");
              setFilterEquipment("");
              setFilterFromDate("");
              setFilterToDate("");

              setTimeout(() => {
                loadAssignments();
              }, 0);
            }}
          >
            Clear
          </button>
        </div>

        {assignments.length > 0 ? (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Base</th>
                  <th style={styles.th}>Equipment</th>
                  <th style={styles.th}>Personnel Name</th>
                  <th style={styles.th}>Personnel ID</th>
                  <th style={styles.th}>Quantity</th>
                  <th style={styles.th}>Assigned Date</th>
                </tr>
              </thead>

              <tbody>
                {assignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <td style={styles.td}>{assignment.id}</td>
                    <td style={styles.td}>{assignment.base_name}</td>
                    <td style={styles.td}>{assignment.equipment_name}</td>
                    <td style={styles.td}>{assignment.personnel_name}</td>
                    <td style={styles.td}>{assignment.personnel_id}</td>
                    <td style={styles.td}>{assignment.quantity}</td>
                    <td style={styles.td}>{assignment.assigned_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={styles.noData}>No assignments found.</p>
        )}
      </div>

      <form style={styles.section} onSubmit={handleExpenditureSubmit}>
        <h2>Expenditure Management</h2>

        <div style={styles.formGrid}>
          <div style={styles.formField}>
            <label>Base</label>

            <select
              value={expenditureForm.base_id}
              onChange={(e) =>
                setExpenditureForm({
                  ...expenditureForm,
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

          <div style={styles.formField}>
            <label>Equipment Type</label>

            <select
              value={expenditureForm.equipment_type_id}
              onChange={(e) =>
                setExpenditureForm({
                  ...expenditureForm,
                  equipment_type_id: e.target.value,
                })
              }
            >
              <option value="">Select Equipment</option>

              {equipmentTypes.map((equipment) => (
                <option key={equipment.id} value={equipment.id}>
                  {equipment.name}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formField}>
            <label>Quantity</label>

            <input
              type="number"
              min="1"
              placeholder="Enter quantity"
              value={expenditureForm.quantity}
              onChange={(e) =>
                setExpenditureForm({
                  ...expenditureForm,
                  quantity: e.target.value,
                })
              }
            />
          </div>

          <div style={styles.formField}>
            <label>Expenditure Date</label>

            <input
              type="date"
              value={expenditureForm.expenditure_date}
              onChange={(e) =>
                setExpenditureForm({
                  ...expenditureForm,
                  expenditure_date: e.target.value,
                })
              }
            />
          </div>

          <div style={styles.formField}>
            <label>Reason</label>

            <input
              type="text"
              placeholder="Enter reason"
              value={expenditureForm.reason}
              onChange={(e) =>
                setExpenditureForm({
                  ...expenditureForm,
                  reason: e.target.value,
                })
              }
            />
          </div>
        </div>

        <button type="submit" style={styles.primaryButton}>
          Record Expenditure
        </button>
      </form>

      <div style={styles.section}>
        <h2>Expenditure History</h2>

        <p>
          Total Expenditures: <strong>{expenditures.length}</strong>
        </p>

        <div style={styles.filterBox}>
          <div style={styles.filterField}>
            <label>From Date</label>

            <input
              type="date"
              value={expenditureFilterFromDate}
              onChange={(e) => setExpenditureFilterFromDate(e.target.value)}
            />
          </div>

          <div style={styles.filterField}>
            <label>To Date</label>

            <input
              type="date"
              value={expenditureFilterToDate}
              onChange={(e) => setExpenditureFilterToDate(e.target.value)}
            />
          </div>

          <div style={styles.filterField}>
            <label>Base</label>

            <select
              value={expenditureFilterBase}
              onChange={(e) => setExpenditureFilterBase(e.target.value)}
            >
              <option value="">All Bases</option>

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
              value={expenditureFilterEquipment}
              onChange={(e) => setExpenditureFilterEquipment(e.target.value)}
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
          <button
            type="button"
            style={styles.applyButton}
            onClick={loadExpenditures}
          >
            Apply Filters
          </button>

          <button
            type="button"
            style={styles.clearButton}
            onClick={() => {
              setExpenditureFilterBase("");
              setExpenditureFilterEquipment("");
              setExpenditureFilterFromDate("");
              setExpenditureFilterToDate("");

              setTimeout(() => {
                loadExpenditures();
              }, 0);
            }}
          >
            Clear
          </button>
        </div>

        {expenditures.length > 0 ? (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Base</th>
                  <th style={styles.th}>Equipment</th>
                  <th style={styles.th}>Quantity</th>
                  <th style={styles.th}>Expenditure Date</th>
                  <th style={styles.th}>Reason</th>
                </tr>
              </thead>

              <tbody>
                {expenditures.map((expenditure) => (
                  <tr key={expenditure.id}>
                    <td style={styles.td}>{expenditure.id}</td>
                    <td style={styles.td}>{expenditure.base_name}</td>
                    <td style={styles.td}>{expenditure.equipment_name}</td>
                    <td style={styles.td}>{expenditure.quantity}</td>
                    <td style={styles.td}>{expenditure.expenditure_date}</td>
                    <td style={styles.td}>{expenditure.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={styles.noData}>No expenditures found.</p>
        )}
      </div>
    </div>
  );
}

const styles = {
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

  tableContainer: {
    overflowX: "auto",
    marginTop: "20px",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "800px",
  },

  th: {
    padding: "12px",
    textAlign: "left",
    borderBottom: "2px solid #e5e7eb",
    color: "#4b5563",
    whiteSpace: "nowrap",
  },

  td: {
    padding: "12px",
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
  },

  noData: {
    marginTop: "20px",
    color: "#6b7280",
  },

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
};

export default AssignmentsExpenditures;
