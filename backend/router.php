<?php

declare(strict_types=1);

$uriPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
$filePath = __DIR__ . $uriPath;

if ($uriPath !== '/' && is_file($filePath)) {
    return false;
}

require __DIR__ . '/index.php';
