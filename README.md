# Employee Management (React + PHP + MySQL)

```
employee-management/
├── backend/
│   ├── add_employee.php   # Employee API backed by MySQL
│   └── database.sql       # creates company_db + employees table
└── frontend/              # React (Vite)
    ├── package.json
    ├── vite.config.js     # proxies REST-style /api/employees routes to PHP
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── EmployeeForm.jsx
        └── EmployeeForm.css
```

## Requirements
Node.js 18+, PHP 8+ (with the `pdo_mysql` extension), MySQL or MariaDB.

## 1. Database
    mysql -u root -p < backend/database.sql
(or import `backend/database.sql` in phpMyAdmin)

## 2. Backend
Edit the DB credentials at the top of `backend/add_employee.php`, then:

    cd backend
    php -S localhost:8000

## 3. Frontend
In a second terminal:

    cd frontend
    npm install
    npm run dev

Open http://localhost:5173

## Employee API endpoints
The frontend uses these REST-style URLs through the Vite proxy:

- `GET http://localhost:5173/api/employees` — list employees
- `POST http://localhost:5173/api/employees` — add an employee
- `PUT http://localhost:5173/api/employees/{id}` — update an employee
- `DELETE http://localhost:5173/api/employees/{id}` — delete an employee

## Check the data
    mysql -u root -p -e "SELECT * FROM company_db.employees;"
