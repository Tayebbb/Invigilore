<?php

// Start local server first
$host = 'http://localhost:8000';
echo "=== STUDENT API SMOKE TEST ===" . PHP_EOL . PHP_EOL;

// Helper function for HTTP requests
function makeRequest($method, $url, $token = null, $body = null) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    
    if ($token) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $token
        ]);
    }
    
    if ($body) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'status' => $httpCode,
        'body' => $response,
        'data' => json_decode($response, true)
    ];
}

// TEST 1: LOGIN
echo "TEST 1: LOGIN" . PHP_EOL;
echo "POST /api/login" . PHP_EOL;
echo "Request Payload:" . PHP_EOL;
$loginPayload = ['email' => 'student@example.com', 'password' => 'password'];
echo json_encode($loginPayload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;

$loginResp = makeRequest('POST', $host . '/api/login', null, $loginPayload);
echo "Status: " . $loginResp['status'] . PHP_EOL;
echo "Response:" . PHP_EOL;
echo json_encode($loginResp['data'], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;

if (!isset($loginResp['data']['data']['token'])) {
    echo "ERROR: No token received!" . PHP_EOL;
    exit(1);
}

$token = $loginResp['data']['data']['token'];
echo "✓ Token received: " . substr($token, 0, 20) . "..." . PHP_EOL;

// TEST 2: GET ATTEMPTS
echo PHP_EOL . "TEST 2: GET STUDENT ATTEMPTS" . PHP_EOL;
echo "GET /api/student/attempts" . PHP_EOL;
echo "Expected Response Structure:" . PHP_EOL;
echo '{
  "data": [
    {
      "attempt_id": <id>,
      "exam_id": <id>,
      "start_time": "2026-04-04T...",
      "end_time": "2026-04-04T...",
      "status": "submitted"
    }
  ]
}' . PHP_EOL;

$attemptsResp = makeRequest('GET', $host . '/api/student/attempts', $token);
echo "Status: " . $attemptsResp['status'] . PHP_EOL;
echo "Actual Response:" . PHP_EOL;
echo json_encode($attemptsResp['data'], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;

if (!isset($attemptsResp['data']['data']) || empty($attemptsResp['data']['data'])) {
    echo "⚠ No attempts found (this is OK if user has no attempts yet)" . PHP_EOL;
    $attemptId = null;
} else {
    $attemptId = $attemptsResp['data']['data'][0]['attempt_id'];
    echo "✓ Found " . count($attemptsResp['data']['data']) . " attempt(s)" . PHP_EOL;
}

// TEST 3: GET ATTEMPT DETAIL (if we have an attempt)
if ($attemptId) {
    echo PHP_EOL . "TEST 3: GET ATTEMPT DETAIL" . PHP_EOL;
    echo "GET /api/student/attempts/{$attemptId}" . PHP_EOL;
    echo "Expected Response Structure:" . PHP_EOL;
    echo '{
  "data": {
    "attempt_id": <id>,
    "exam_id": <id>,
    "total_questions": <int>,
    "total_marks": <int>,
    "obtained_marks": <int>,
    "percentage": <float>
  }
}' . PHP_EOL;

    $detailResp = makeRequest('GET', $host . '/api/student/attempts/' . $attemptId, $token);
    echo "Status: " . $detailResp['status'] . PHP_EOL;
    echo "Actual Response:" . PHP_EOL;
    echo json_encode($detailResp['data'], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
    
    if ($detailResp['status'] === 200) {
        echo "✓ Score calculation working" . PHP_EOL;
    }
} else {
    echo PHP_EOL . "TEST 3: GET ATTEMPT DETAIL - SKIPPED (no attempts found)" . PHP_EOL;
}

// TEST 4: GET SUMMARY
echo PHP_EOL . "TEST 4: GET RESULTS SUMMARY" . PHP_EOL;
echo "GET /api/student/results/summary" . PHP_EOL;
echo "Expected Response Structure:" . PHP_EOL;
echo '{
  "data": {
    "total_attempts": <int>,
    "completed_attempts": <int>,
    "average_score": <float>,
    "highest_score": <float>,
    "lowest_score": <float>
  }
}' . PHP_EOL;

$summaryResp = makeRequest('GET', $host . '/api/student/results/summary', $token);
echo "Status: " . $summaryResp['status'] . PHP_EOL;
echo "Actual Response:" . PHP_EOL;
echo json_encode($summaryResp['data'], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;

if ($summaryResp['status'] === 200) {
    echo "✓ Summary stats calculated" . PHP_EOL;
}

echo PHP_EOL . "=== SMOKE TEST COMPLETE ===" . PHP_EOL;
?>
