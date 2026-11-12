import { useEffect, useState } from "react";
import "./EmployeeList.css";

const API_URL = import.meta.env.VITE_API_URL || "/api/employees";

export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({ name: "", email: "", role: "" });
  const [editErrors, setEditErrors] = useState({});
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadEmployees() {
      setLoading(true);
      setStatus({ type: "", message: "" });

      try {
        const response = await fetch(API_URL);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Could not load employees.");
        }

        if (active) setEmployees(data.employees);
      } catch {
        if (active) {
          setStatus({
            type: "error",
            message: "Could not load employees. Check that PHP and MySQL are running, then try again.",
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadEmployees();
    return () => {
      active = false;
    };
  }, [reload]);

  const startEditing = (employee) => {
    setEditingId(employee.id);
    setEditValues({ name: employee.name, email: employee.email, role: employee.role });
    setEditErrors({});
    setStatus({ type: "", message: "" });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditErrors({});
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditValues((values) => ({ ...values, [name]: value }));
    setEditErrors((errors) => ({ ...errors, [name]: undefined }));
  };

  const saveEmployee = async (event, employeeId) => {
    event.preventDefault();
    const values = {
      name: editValues.name.trim(),
      email: editValues.email.trim(),
      role: editValues.role.trim(),
    };
    const errors = {};

    if (!values.name) errors.name = "Enter a name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      errors.email = "Enter a valid email address.";
    }
    if (!values.role) errors.role = "Choose a role.";

    if (Object.keys(errors).length) {
      setEditErrors(errors);
      return;
    }

    setBusyId(employeeId);
    setStatus({ type: "", message: "" });
    try {
      const response = await fetch(`${API_URL}/${encodeURIComponent(employeeId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setEditErrors(data.errors || {});
        throw new Error(data.message || "Could not update employee.");
      }

      setEmployees((current) =>
        current.map((employee) =>
          employee.id === employeeId ? { ...employee, ...values } : employee
        )
      );
      setEditingId(null);
      setStatus({ type: "success", message: "Employee updated." });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Could not reach the server. Check that PHP and MySQL are running.",
      });
    } finally {
      setBusyId(null);
    }
  };

  const deleteEmployee = async (employee) => {
    if (!window.confirm(`Delete ${employee.name}? `)) return;

    setBusyId(employee.id);
    setStatus({ type: "", message: "" });
    try {
      const response = await fetch(`${API_URL}/${encodeURIComponent(employee.id)}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not delete employee.");
      }

      setEmployees((current) => current.filter((item) => item.id !== employee.id));
      if (editingId === employee.id) cancelEditing();
      setStatus({ type: "success", message: "Employee deleted." });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Could not reach the server. Check that PHP and MySQL are running.",
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="employee-list" aria-labelledby="employee-list-title">
      <div className="employee-list-heading">
        <h1 id="employee-list-title">Employees</h1>
        <button
          className="employee-list-refresh"
          type="button"
          onClick={() => setReload((count) => count + 1)}
          disabled={loading}
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {status.message && (
        <p className={`ef-status ef-status--${status.type}`} role={status.type === "error" ? "alert" : "status"}>
          {status.message}
        </p>
      )}

      {!loading && !status.message && employees.length === 0 && (
        <p className="employee-list-empty">No employees have been added yet.</p>
      )}

      {employees.length > 0 && (
        <div className="employee-list-table-wrap">
          <table className="employee-list-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Role</th>
                <th scope="col">Added</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id}>
                  {editingId === employee.id ? (
                    <>
                      <td>
                        <input
                          className="employee-list-input"
                          name="name"
                          aria-label="Employee name"
                          aria-invalid={!!editErrors.name}
                          value={editValues.name}
                          onChange={handleEditChange}
                        />
                        {editErrors.name && <span className="ef-error">{editErrors.name}</span>}
                      </td>
                      <td>
                        <input
                          className="employee-list-input"
                          name="email"
                          type="email"
                          aria-label="Employee email"
                          aria-invalid={!!editErrors.email}
                          value={editValues.email}
                          onChange={handleEditChange}
                        />
                        {editErrors.email && <span className="ef-error">{editErrors.email}</span>}
                      </td>
                      <td>
                        <input
                          className="employee-list-input"
                          name="role"
                          aria-label="Employee role"
                          aria-invalid={!!editErrors.role}
                          value={editValues.role}
                          onChange={handleEditChange}
                        />
                        {editErrors.role && <span className="ef-error">{editErrors.role}</span>}
                      </td>
                      <td>{employee.created_at}</td>
                      <td className="employee-list-actions">
                        <button
                          className="employee-list-action"
                          type="button"
                          onClick={(event) => saveEmployee(event, employee.id)}
                          disabled={busyId === employee.id}
                        >
                          {busyId === employee.id ? "Saving…" : "Save"}
                        </button>
                        <button
                          className="employee-list-action"
                          type="button"
                          onClick={cancelEditing}
                          disabled={busyId === employee.id}
                        >
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{employee.name}</td>
                      <td>{employee.email}</td>
                      <td>{employee.role}</td>
                      <td>{employee.created_at}</td>
                      <td className="employee-list-actions">
                        <button
                          className="employee-list-action"
                          type="button"
                          onClick={() => startEditing(employee)}
                          disabled={busyId !== null}
                        >
                          Edit
                        </button>
                        <button
                          className="employee-list-action employee-list-action--delete"
                          type="button"
                          onClick={() => deleteEmployee(employee)}
                          disabled={busyId !== null}
                        >
                          {busyId === employee.id ? "Deleting…" : "Delete"}
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
