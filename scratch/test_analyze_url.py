import requests, json, sys
url = 'http://127.0.0.1:5000/api/analyze-url'
for test_url in ['https://example.com', 'http://127.0.0.1', 'http://malicious.test/@@@']:
    try:
        r = requests.post(url, json={'url': test_url}, timeout=5)
        print('Test URL:', test_url)
        print('Status:', r.status_code)
        print('Response:', r.text)
    except Exception as e:
        print('Error for', test_url, e)
