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
if ($envFile) {
    $envLines = @file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
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
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $curlError = curl_error($ch);
    curl_close($ch);
    return [$response, $httpCode, $headerSize, $curlError];
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

// 2. Primary request attempt to Node server on detected port
$candidatePorts = array_unique([(int)$port, 4000, 3000, 8080]);
$connected = false;
$response = false;
$httpCode = 0;
$headerSize = 0;
$curlError = '';
$activePort = $port;

foreach ($candidatePorts as $p) {
    $targetUrl = "http://127.0.0.1:{$p}{$requestUri}";
    list($resp, $code, $hSize, $cErr) = forwardCurlRequest($targetUrl, $method, $body, $forwardHeaders, 3);
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

// 3. If unreachable, locate app.js and attempt auto-spawn
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

$nodeBins = [
    '/opt/alt/alt-nodejs22/root/usr/bin/node',
    '/opt/alt/alt-nodejs20/root/usr/bin/node',
    '/opt/alt/alt-nodejs18/root/usr/bin/node',
    '/usr/local/bin/node',
    '/usr/bin/node',
    'node',
];

$detectedNodeBin = null;
$disabled = array_map('trim', explode(',', (string)ini_get('disable_functions')));
$canExec = function_exists('exec') && !in_array('exec', $disabled);

if (!$connected && $canExec && $detectedAppRoot) {
    foreach ($nodeBins as $bin) {
        $version = @shell_exec("{$bin} -v 2>&1");
        if ($version && strpos(trim($version), 'v') === 0) {
            $detectedNodeBin = $bin;
            break;
        }
    }

    if ($detectedNodeBin) {
        $logDir = $detectedAppRoot . '/data';
        if (!is_dir($logDir)) @mkdir($logDir, 0755, true);
        $logFile = $logDir . '/hostinger_node.log';
        $cmd = "cd " . escapeshellarg($detectedAppRoot) . " && PORT={$port} NODE_ENV=production nohup " . escapeshellcmd($detectedNodeBin) . " app.js > " . escapeshellarg($logFile) . " 2>&1 &";
        @exec($cmd);

        // Pause for socket initialization
        usleep(1500000); // 1.5s

        // Retry connection
        $targetUrl = "http://127.0.0.1:{$port}{$requestUri}";
        list($resp, $code, $hSize, $cErr) = forwardCurlRequest($targetUrl, $method, $body, $forwardHeaders, 5);
        if ($resp !== false && $code > 0) {
            $response = $resp;
            $httpCode = $code;
            $headerSize = $hSize;
            $connected = true;
        } else {
            $curlError = $cErr;
        }
    }
}

// 4. Return successful response
if ($connected) {
    http_response_code($httpCode);
    echo substr($response, $headerSize);
    exit;
}

// 5. Gather log file contents if available for diagnostics
$logOutput = null;
if ($detectedAppRoot && file_exists($detectedAppRoot . '/data/hostinger_node.log')) {
    $logOutput = @file_get_contents($detectedAppRoot . '/data/hostinger_node.log');
    if ($logOutput && strlen($logOutput) > 1000) {
        $logOutput = substr($logOutput, -1000);
    }
}

// 6. Return informative 503 error
http_response_code(503);
echo json_encode([
    'error' => "SocietyOS Node.js backend service is not running on port {$port}.",
    'message' => "Please verify your Node.js application status in Hostinger hPanel (Websites -> Node.js -> Start) or set Application Startup File to 'app.js'.",
    'path' => $requestUri,
    'status' => 503,
    'hint' => 'Hostinger hPanel: Navigate to Websites -> Manage -> Node.js, ensure status is RUNNING, and Application Startup File is app.js.',
    'curlError' => $curlError ?: "Connection refused to 127.0.0.1:{$port}",
    'diagnostics' => [
        'php_version' => PHP_VERSION,
        'detected_app_root' => $detectedAppRoot,
        'detected_node_binary' => $detectedNodeBin,
        'exec_allowed' => $canExec,
        'env_file_loaded' => $envFile,
        'log_tail' => $logOutput,
    ]
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
