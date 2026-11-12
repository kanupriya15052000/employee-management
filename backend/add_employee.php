<?php

$DB_HOST = 'localhost';
$DB_NAME = 'company_db';
$DB_USER = 'root';
$DB_PASS = '';


$ALLOWED_ORIGINS = ['http://localhost:3000', 'http://localhost:5173'];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $ALLOWED_ORIGINS, true)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    $pdo = new PDO(
        "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4",
        $DB_USER,
        $DB_PASS,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $employees = $pdo->query(
            'SELECT id, name, email, role, created_at FROM employees ORDER BY id DESC'
        )->fetchAll();

        echo json_encode(['success' => true, 'employees' => $employees]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'DELETE' || $_SERVER['REQUEST_METHOD'] === 'PUT') {
        $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if ($id === false || $id === null) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'A valid employee ID is required.']);
            exit;
        }

        if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
            $stmt = $pdo->prepare('DELETE FROM employees WHERE id = :id');
            $stmt->execute([':id' => $id]);

            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Employee not found.']);
                exit;
            }

            echo json_encode(['success' => true, 'message' => 'Employee deleted.']);
            exit;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $data = is_array($data) ? $data : [];
        $name = is_string($data['name'] ?? null) ? trim($data['name']) : '';
        $email = is_string($data['email'] ?? null) ? trim($data['email']) : '';
        $role = is_string($data['role'] ?? null) ? trim($data['role']) : '';

        $errors = [];
        if ($name === '' || mb_strlen($name) > 100) {
            $errors['name'] = 'Enter a name (up to 100 characters).';
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 150) {
            $errors['email'] = 'Enter a valid email address.';
        }
        if ($role === '' || mb_strlen($role) > 100) {
            $errors['role'] = 'Choose a role.';
        }

        if ($errors) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'Please fix the errors below.', 'errors' => $errors]);
            exit;
        }

        $stmt = $pdo->prepare(
            'UPDATE employees SET name = :name, email = :email, role = :role WHERE id = :id'
        );
        $stmt->execute([':name' => $name, ':email' => $email, ':role' => $role, ':id' => $id]);

        if ($stmt->rowCount() === 0) {
            $check = $pdo->prepare('SELECT id FROM employees WHERE id = :id');
            $check->execute([':id' => $id]);
            if (!$check->fetch()) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Employee not found.']);
                exit;
            }
        }

        echo json_encode(['success' => true, 'message' => 'Employee updated.']);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        header('Allow: GET, POST, PUT, DELETE, OPTIONS');
        echo json_encode(['success' => false, 'message' => 'Use GET, POST, PUT, or DELETE.']);
        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $data = is_array($data) ? $data : [];
    $name = is_string($data['name'] ?? null) ? trim($data['name']) : '';
    $email = is_string($data['email'] ?? null) ? trim($data['email']) : '';
    $role = is_string($data['role'] ?? null) ? trim($data['role']) : '';

    $errors = [];
    if ($name === '' || mb_strlen($name) > 100) {
        $errors['name'] = 'Enter a name (up to 100 characters).';
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 150) {
        $errors['email'] = 'Enter a valid email address.';
    }
    if ($role === '' || mb_strlen($role) > 100) {
        $errors['role'] = 'Choose a role.';
    }

    if ($errors) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'Please fix the errors below.', 'errors' => $errors]);
        exit;
    }

    $stmt = $pdo->prepare('INSERT INTO employees (name, email, role) VALUES (:name, :email, :role)');
    $stmt->execute([':name' => $name, ':email' => $email, ':role' => $role]);

    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Employee added.',
        'id'      => (int) $pdo->lastInsertId(),
    ]);
} catch (PDOException $e) {
    // 1062 = duplicate entry (email is UNIQUE)
    if (($e->errorInfo[1] ?? null) === 1062) {
        http_response_code(409);
        echo json_encode([
            'success' => false,
            'message' => 'Please fix the errors below.',
            'errors'  => ['email' => 'An employee with this email already exists.'],
        ]);
    } else {
        error_log($e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Server error. Try again later.']);
    }
}
