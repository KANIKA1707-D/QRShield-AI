import requests, json

def test(payload, description):
    url='http://127.0.0.1:5000/api/analyze-email'
    try:
        resp=requests.post(url, json=payload)
        print(f'--- {description} ---')
        print('Status:', resp.status_code)
        print('Response:', resp.json())
    except Exception as e:
        print(f'Error during {description}:', e)

# 1. Email with URLs
payload1={'email_text':'Please visit https://example.com and also http://test.org for info.'}
test(payload1, 'Email with URLs')

# 2. Email with no URLs
payload2={'email_text':'Just some text with no links.'}
test(payload2, 'Email with no URLs')

# 3. Empty email
payload3={'email_text':''}
test(payload3, 'Empty email')
