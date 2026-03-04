<?php

declare(strict_types=1);

function getEnvValue(string $key, ?string $default = null): ?string
{
    $value = getenv($key);
    return $value === false ? $default : $value;
}

function getPDO(): PDO
{
    $host = getEnvValue('DB_HOST', '127.0.0.1');
    $port = getEnvValue('DB_PORT', '3306');
    $dbName = getEnvValue('DB_NAME', 'kopi_db');
    $username = getEnvValue('DB_USER', 'root');
    $password = getEnvValue('DB_PASS', '');

    $dsn = "mysql:host={$host};port={$port};dbname={$dbName};charset=utf8mb4";

    return new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
}
