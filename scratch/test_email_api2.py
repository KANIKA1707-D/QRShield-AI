import requests, json

def run_test(payload, description):
    url='http://127.0.0.1:5000/api/analyze-email'
    try:
        resp=requests.post(url, json=payload)
        print(f'--- {description} ---')
        print('Status:', resp.status_code)
        print('Response:', resp.json())
    except Exception as e:
        print(f'Error during {description}:', e)

# Test 1: Email with URLs
payload1={"email_text":"Hello, please visit https://example.com and https://google.com for more information."}
run_test(payload1, 'Test 1')

# Test 2: Email without URL
payload2={"email_text":"Hello, this is a normal email without any link."}
run_test(payload2, 'Test 2')

# Test 3: Empty email
payload3={"email_text":""}
run_test(payload3, 'Test 3')
