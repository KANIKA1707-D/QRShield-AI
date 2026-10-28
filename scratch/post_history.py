import json, urllib.request, sys
payload = {
    "timestamp": "2026-10-26T15:00:00Z",
    "decoded_url": "https://example.com",
    "risk_score": 10,
    "risk_level": "LOW",
    "indicators": [],
    "message": "No major suspicious indicators were detected."
}
url = 'http://127.0.0.1:5000/api/history'
req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), method='POST')
req.add_header('Content-Type', 'application/json')
with urllib.request.urlopen(req) as resp:
    print(resp.read().decode())
