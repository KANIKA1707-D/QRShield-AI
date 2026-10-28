import urllib.request, json

def post(url, payload):
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.getcode(), resp.read().decode('utf-8')
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8')
    except Exception as e:
        return None, str(e)

cases = [
    ("case1", {"email_text": "Hello, please visit https://example.com and https://google.com"}),
    ("case2", {"email_text": "This email contains no links"}),
    ("case3", {"email_text": ""})
]

for name, payload in cases:
    status, response = post('http://127.0.0.1:5000/api/analyze-email', payload)
    print(f"--- {name} ---")
    print('Status:', status)
    print('Response:', response)
    print()
