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

// 1. Determine local Node.js port (from environment or default 4000)
$port = getenv('PORT') ?: 4000;
$envFile = file_exists(__DIR__ . '/../.env') ? __DIR__ . '/../.env' : (file_exists(__DIR__ . '/../hostinger.env') ? __DIR__ . '/../hostinger.env' : null);
if ($envFile) {
    $envLines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($envLines as $line) {
        $trimmed = trim($line);
        if (strpos($trimmed, 'PORT=') === 0) {
            $val = trim(substr($trimmed, 5), " \t\n\r\0\x0B\"'");
            if (is_numeric($val)) $port = (int)$val;
        }
    }
}

$requestUri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];
$targetUrl = "http://127.0.0.1:{$port}{$requestUri}";

function forwardCurlRequest($targetUrl, $method, $body, $headers, $timeout = 30) {
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
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $curlError = curl_error($ch);
    curl_close($ch);
    return [$response, $httpCode, $headerSize, $curlError];
}

// Forward raw body if present
$body = file_get_contents('php://input');

// Forward request headers
$forwardHeaders = [];
if (function_exists('getallheaders')) {
    foreach (getallheaders() as $name => $value) {
        if (strtolower($name) !== 'host') {
            $forwardHeaders[] = "{$name}: {$value}";
        }
    }
}

// 2. Primary request attempt to Node server
list($response, $httpCode, $headerSize, $curlError) = forwardCurlRequest($targetUrl, $method, $body, $forwardHeaders);

// 3. If unreachable, attempt auto-spawn in background if exec is enabled
if ($response === false || $httpCode === 0) {
    $disabled = array_map('trim', explode(',', (string)ini_get('disable_functions')));
    if (function_exists('exec') && !in_array('exec', $disabled)) {
        $root = realpath(__DIR__ . '/..');
        $nodeBins = ['/usr/bin/node', '/usr/local/bin/node', 'node'];
        foreach ($nodeBins as $bin) {
            $logDir = $root . '/data';
            if (!is_dir($logDir)) @mkdir($logDir, 0755, true);
            $cmd = "cd " . escapeshellarg($root) . " && nohup {$bin} app.js > " . escapeshellarg($logDir . '/node_output.log') . " 2>&1 &";
            @exec($cmd);
        }
        // Small pause to allow socket to bind
        usleep(800000); // 800ms
        list($response, $httpCode, $headerSize, $curlError) = forwardCurlRequest($targetUrl, $method, $body, $forwardHeaders);
    }
}

// 4. Output response or informative error
if ($response === false || $httpCode === 0) {
    http_response_code(503);
    echo json_encode([
        'error' => "SocietyOS Node.js backend service is not running on port {$port}.",
        'message' => "Please start your Node.js application in Hostinger hPanel (Websites -> Node.js -> Start) or run 'node app.js' via SSH.",
        'path' => $requestUri,
        'status' => 503,
        'hint' => 'If using Hostinger Web Applications, upload hostinger-web-app-complete.zip directly.',
        'curlError' => $curlError ?: 'Connection refused to 127.0.0.1:' . $port
    ], JSON_PRETTY_PRINT);
    exit;
}

http_response_code($httpCode);
echo substr($response, $headerSize);
