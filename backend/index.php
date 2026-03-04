<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function respond(int $statusCode, array $data): void
{
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

function getJsonBody(): array
{
    $rawBody = file_get_contents('php://input');
    if (!$rawBody) {
        return [];
    }

    $decoded = json_decode($rawBody, true);
    if (!is_array($decoded)) {
        respond(400, ['message' => 'Body JSON tidak valid']);
    }

    return $decoded;
}

$uriPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/';
$segments = array_values(array_filter(explode('/', $uriPath)));

if (count($segments) >= 1 && $segments[0] === 'api') {
    array_shift($segments);
}

$method = $_SERVER['REQUEST_METHOD'];

if (count($segments) === 1 && $segments[0] === 'health' && $method === 'GET') {
    respond(200, ['status' => 'ok']);
}

if (count($segments) < 1 || $segments[0] !== 'coffees') {
    respond(404, ['message' => 'Endpoint tidak ditemukan']);
}

$id = null;
if (isset($segments[1])) {
    if (!ctype_digit($segments[1])) {
        respond(400, ['message' => 'ID harus angka']);
    }
    $id = (int)$segments[1];
}

try {
    $pdo = getPDO();

    if ($method === 'GET' && $id === null) {
        $stmt = $pdo->query('SELECT id, name, origin, price, stock, description, created_at, updated_at FROM coffees ORDER BY id DESC');
        $rows = $stmt->fetchAll();
        respond(200, ['data' => $rows]);
    }

    if ($method === 'GET' && $id !== null) {
        $stmt = $pdo->prepare('SELECT id, name, origin, price, stock, description, created_at, updated_at FROM coffees WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        if (!$row) {
            respond(404, ['message' => 'Data kopi tidak ditemukan']);
        }

        respond(200, ['data' => $row]);
    }

    if ($method === 'POST' && $id === null) {
        $body = getJsonBody();

        $name = trim((string)($body['name'] ?? ''));
        $origin = trim((string)($body['origin'] ?? ''));
        $price = (float)($body['price'] ?? 0);
        $stock = (int)($body['stock'] ?? 0);
        $description = trim((string)($body['description'] ?? ''));

        if ($name === '' || $origin === '' || $price <= 0 || $stock < 0) {
            respond(422, ['message' => 'Field name, origin, price (>0), stock (>=0) wajib valid']);
        }

        $stmt = $pdo->prepare(
            'INSERT INTO coffees (name, origin, price, stock, description) VALUES (:name, :origin, :price, :stock, :description)'
        );
        $stmt->execute([
            'name' => $name,
            'origin' => $origin,
            'price' => $price,
            'stock' => $stock,
            'description' => $description,
        ]);

        respond(201, ['message' => 'Data kopi berhasil ditambahkan', 'id' => (int)$pdo->lastInsertId()]);
    }

    if ($method === 'PUT' && $id !== null) {
        $body = getJsonBody();

        $name = trim((string)($body['name'] ?? ''));
        $origin = trim((string)($body['origin'] ?? ''));
        $price = (float)($body['price'] ?? 0);
        $stock = (int)($body['stock'] ?? 0);
        $description = trim((string)($body['description'] ?? ''));

        if ($name === '' || $origin === '' || $price <= 0 || $stock < 0) {
            respond(422, ['message' => 'Field name, origin, price (>0), stock (>=0) wajib valid']);
        }

        $check = $pdo->prepare('SELECT id FROM coffees WHERE id = :id');
        $check->execute(['id' => $id]);
        if (!$check->fetch()) {
            respond(404, ['message' => 'Data kopi tidak ditemukan']);
        }

        $stmt = $pdo->prepare(
            'UPDATE coffees SET name = :name, origin = :origin, price = :price, stock = :stock, description = :description, updated_at = CURRENT_TIMESTAMP WHERE id = :id'
        );
        $stmt->execute([
            'id' => $id,
            'name' => $name,
            'origin' => $origin,
            'price' => $price,
            'stock' => $stock,
            'description' => $description,
        ]);

        respond(200, ['message' => 'Data kopi berhasil diperbarui']);
    }

    if ($method === 'DELETE' && $id !== null) {
        $check = $pdo->prepare('SELECT id FROM coffees WHERE id = :id');
        $check->execute(['id' => $id]);
        if (!$check->fetch()) {
            respond(404, ['message' => 'Data kopi tidak ditemukan']);
        }

        $stmt = $pdo->prepare('DELETE FROM coffees WHERE id = :id');
        $stmt->execute(['id' => $id]);

        respond(200, ['message' => 'Data kopi berhasil dihapus']);
    }

    respond(405, ['message' => 'Method tidak didukung untuk endpoint ini']);
} catch (PDOException $exception) {
    respond(500, ['message' => 'Gagal akses database', 'error' => $exception->getMessage()]);
}
