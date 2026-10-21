<?php
/**
 * SocietyOS — Production API Gateway & Reverse Proxy for Hostinger
 * -----------------------------------------------------------------
 * Handles all /api/* routes on Hostinger Apache / LiteSpeed Web Server.
 * Forwards requests to the local Node.js server (port 4000 or env PORT)
 * and returns clean JSON under all circumstances (never HTML).
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// 1. Locate environment file (.env or hostinger.env)
$envCandidates = [
    __DIR__ . '/../.env',
    __DIR__ . '/../hostinger.env',
    __DIR__ . '/../../hbuilds/current/.env',
    __DIR__ . '/../../hbuilds/current/hostinger.env',
    __DIR__ . '/../../../hbuilds/current/.env',
    __DIR__ . '/../../../hbuilds/current/hostinger.env',
];

$envFile = null;
foreach ($envCandidates as $candidate) {
    if (file_exists($candidate)) {
        $envFile = $candidate;
        break;
    }
}

$port = getenv('PORT') ?: 4000;
$mysqlHost = '127.0.0.1';
$mysqlPort = 3306;
$mysqlDb = '';
$mysqlUser = '';
$mysqlPass = '';

if ($envFile) {
    $envLines = @file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
    foreach ($envLines as $line) {
        $trimmed = trim($line);
        if (strpos($trimmed, '#') === 0 || strpos($trimmed, '=') === false) continue;
        list($k, $v) = explode('=', $trimmed, 2);
        $k = trim($k);
        $v = trim($v, " \t\n\r\0\x0B\"'");
        if ($k === 'PORT' && is_numeric($v)) $port = (int)$v;
        if ($k === 'MYSQL_HOST') $mysqlHost = $v;
        if ($k === 'MYSQL_PORT' && is_numeric($v)) $mysqlPort = (int)$v;
        if ($k === 'MYSQL_DATABASE') $mysqlDb = $v;
        if ($k === 'MYSQL_USER') $mysqlUser = $v;
        if ($k === 'MYSQL_PASSWORD') $mysqlPass = $v;
    }
}

$requestUri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];
$requestPath = parse_url($requestUri, PHP_URL_PATH);

// Browser GET /api/auth/login redirect to single page app
if ($method === 'GET' && rtrim($requestPath, '/') === '/api/auth/login') {
    $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
    if (strpos($accept, 'text/html') !== false || strpos($accept, '*/*') !== false) {
        header('Location: /', true, 302);
        exit;
    }
}

function forwardCurlRequest($targetUrl, $method, $body, $headers, $timeout = 10) {
    $ch = curl_init($targetUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 2);
    curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
    curl_setopt($ch, CURLOPT_HEADER, true);
    if (!empty($body)) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }
    if (!empty($headers)) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    }
    $raw = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $curlError = curl_error($ch);
    curl_close($ch);
    return [$raw, $httpCode, $headerSize, $curlError];
}

$body = file_get_contents('php://input');

$forwardHeaders = [];
if (function_exists('getallheaders')) {
    foreach (getallheaders() as $name => $value) {
        if (strtolower($name) !== 'host') {
            $forwardHeaders[] = "{$name}: {$value}";
        }
    }
}

// 2. Primary request attempt to Node server across all candidate ports
$candidatePorts = array_unique([(int)$port, 4000, 3000, 8080, 5000]);
$connected = false;
$response = false;
$httpCode = 0;
$headerSize = 0;
$curlError = '';
$activePort = $port;

foreach ($candidatePorts as $p) {
    $targetUrl = "http://127.0.0.1:{$p}{$requestUri}";
    list($resp, $code, $hSize, $cErr) = forwardCurlRequest($targetUrl, $method, $body, $forwardHeaders, 2);
    if ($resp !== false && $code > 0) {
        $response = $resp;
        $httpCode = $code;
        $headerSize = $hSize;
        $activePort = $p;
        $connected = true;
        break;
    }
    $curlError = $cErr;
}

// 3. If connected, return response directly
if ($connected) {
    http_response_code($httpCode);
    echo substr($response, $headerSize);
    exit;
}

// 4. Direct PHP PDO Health Check fallback for /api/health
if (rtrim($requestPath, '/') === '/api/health') {
    $mysqlOk = false;
    $mysqlError = null;
    $tableCount = 0;
    try {
        if (!empty($mysqlDb) && !empty($mysqlUser)) {
            $dsn = "mysql:host={$mysqlHost};port={$mysqlPort};dbname={$mysqlDb};charset=utf8mb4";
            $pdo = new PDO($dsn, $mysqlUser, $mysqlPass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT => 3,
            ]);
            $stmt = $pdo->query("SELECT count(*) FROM information_schema.tables WHERE table_schema = DATABASE()");
            $tableCount = (int)$stmt->fetchColumn();
            $mysqlOk = true;
        } else {
            $mysqlError = 'MySQL credentials missing or unconfigured in .env';
        }
    } catch (\Throwable $e) {
        $mysqlError = $e->getMessage();
    }

    http_response_code(200);
    echo json_encode([
        'status' => 'ok',
        'backend' => 'SocietyOS Hostinger Gateway',
        'nodeRunning' => false,
        'mysqlConnected' => $mysqlOk,
        'mysqlDatabase' => $mysqlDb,
        'mysqlTables' => $tableCount,
        'mysqlError' => $mysqlError,
        'message' => 'Node.js service is currently stopped. Start it in Hostinger hPanel (Websites -> Manage -> Node.js).',
        'timestamp' => date('c'),
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

// 5. Locate application root directory for diagnostics
$appRootCandidates = [
    realpath(__DIR__ . '/..'),                       // ~/public_html
    realpath(__DIR__ . '/../../hbuilds/current'),    // ~/hbuilds/current
    realpath(__DIR__ . '/../../../hbuilds/current'),
];

$detectedAppRoot = null;
foreach ($appRootCandidates as $candidate) {
    if ($candidate && file_exists($candidate . '/app.js')) {
        $detectedAppRoot = $candidate;
        break;
    }
}

// 6. Return informative 503 error with exact steps to fix
http_response_code(503);
echo json_encode([
    'error' => "SocietyOS Node.js backend service is not running on port {$activePort}.",
    'message' => "Please start your Node.js application in Hostinger hPanel: Websites -> Manage -> Node.js -> Start Application.",
    'path' => $requestUri,
    'status' => 503,
    'hint' => 'Hostinger hPanel: Navigate to Websites -> Manage -> Node.js, ensure status is RUNNING, and Application Startup File is app.js.',
    'steps_to_fix' => [
        '1. Log in to Hostinger hPanel',
        '2. Go to Websites -> Manage next to society.kukudigitallabs.com',
        '3. Search for "Node.js" in the left menu',
        '4. Set Application Startup File to "app.js" (or "dist-server/server.js")',
        '5. Click "Start Application"'
    ],
    'curlError' => $curlError ?: "Connection refused to 127.0.0.1:{$activePort}",
    'diagnostics' => [
        'php_version' => PHP_VERSION,
        'detected_app_root' => $detectedAppRoot,
        'candidate_ports_scanned' => $candidatePorts,
        'env_file_loaded' => $envFile,
        'mysql_configured' => !empty($mysqlDb),
    ]
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
