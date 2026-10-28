import json, sys, urllib.request

def post(url, data):
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'}, method='POST')
    with urllib.request.urlopen(req) as resp:
        return resp.getcode(), resp.read().decode('utf-8')

cases = [
    {"name": "case1", "payload": {"email_text": "Hello, please visit https://example.com and https://google.com"}},
    {"name": "case2", "payload": {"email_text": "This email contains no links"}},
    {"name": "case3", "payload": {"email_text": ""}}
]

for c in cases:
    status, text = post('http://127.0.0.1:5000/api/analyze-email', c['payload'])
    print('---', c['name'], '---')
    print('Status:', status)
    print('Response:', text)
