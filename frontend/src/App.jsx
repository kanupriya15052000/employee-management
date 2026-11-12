import EmployeeForm from "./EmployeeForm";
import EmployeeList from "./EmployeeList";
import { useState } from "react";

export default function App() {
  const [page, setPage] = useState("add");

  return (
    <main>
      <nav className="app-nav" aria-label="Employee pages">
        <button
          type="button"
          className="app-nav-link"
          aria-current={page === "add" ? "page" : undefined}
          onClick={() => setPage("add")}
        >
          Add employee
        </button>
        <button
          type="button"
          className="app-nav-link"
          aria-current={page === "list" ? "page" : undefined}
          onClick={() => setPage("list")}
        >
          View employees
        </button>
      </nav>
      {page === "add" ? <EmployeeForm /> : <EmployeeList />}
    </main>
  );
}
