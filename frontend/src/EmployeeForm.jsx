import { useState } from "react";
import "./EmployeeForm.css";

// In development, Vite forwards /api to the PHP server (see vite.config.js).
// To point somewhere else, set VITE_API_URL in frontend/.env
const API_URL = import.meta.env.VITE_API_URL || "/api/employees";

// Edit this list to match your company's roles
const ROLES = [
  "Software Engineer",
  "Designer",
  "Product Manager",
  "QA Engineer",
  "HR Manager",
  "Sales Executive",
];

const EMPTY = { name: "", email: "", role: "" };

function validate(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = "Enter a name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (!values.role) errors.role = "Choose a role.";
  return errors;
}

export default function EmployeeForm() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setStatus({ type: "", message: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const clientErrors = validate(values);
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      return;
    }

    setSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          email: values.email.trim(),
          role: values.role,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStatus({ type: "success", message: `${values.name.trim()} was added.` });
        setValues(EMPTY);
        setErrors({});
      } else {
        setErrors(data.errors || {});
        setStatus({ type: "error", message: data.message || "Could not add employee." });
      }
    } catch {
      setStatus({
        type: "error",
        message: "Could not reach the server. Check that PHP and MySQL are running.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="ef" onSubmit={handleSubmit} noValidate>
      <h2 className="ef-title">Add employee</h2>

      {status.message && (
        <p className={`ef-status ef-status--${status.type}`} role="status">
          {status.message}
        </p>
      )}

      <div className="ef-field">
        <label htmlFor="name">Full name</label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          value={values.name}
          onChange={handleChange}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
        />
        {errors.name && <span id="name-error" className="ef-error">{errors.name}</span>}
      </div>

      <div className="ef-field">
        <label htmlFor="email">Work email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={handleChange}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && <span id="email-error" className="ef-error">{errors.email}</span>}
      </div>

      <div className="ef-field">
        <label htmlFor="role">Role</label>
        <select
          id="role"
          name="role"
          value={values.role}
          onChange={handleChange}
          aria-invalid={!!errors.role}
          aria-describedby={errors.role ? "role-error" : undefined}
        >
          <option value="">Select a role</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        {errors.role && <span id="role-error" className="ef-error">{errors.role}</span>}
      </div>

      <button className="ef-button" type="submit" disabled={submitting}>
        {submitting ? "Adding…" : "Add employee"}
      </button>
    </form>
  );
}
