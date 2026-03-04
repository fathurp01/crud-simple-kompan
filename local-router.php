<?php

declare(strict_types=1);

$uriPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';

if ($uriPath === '/api' || str_starts_with($uriPath, '/api/') || $uriPath === '/health') {
    require __DIR__ . '/backend/index.php';
    return true;
}

return false;
