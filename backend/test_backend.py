import io
from app import app
client = app.test_client()
# Health check
print('Health:', client.get('/health').json)
# Scan dummy image
with open('backend/dummy.png', 'rb') as f:
    data = {'image': (io.BytesIO(f.read()), 'dummy.png')}
    resp = client.post('/api/scan', content_type='multipart/form-data', data=data)
    print('Scan response:', resp.json)
    if resp.json.get('success'):
        decoded = resp.json.get('decoded_url')
        resp2 = client.post('/api/analyze-url', json={'url': decoded})
        print('Analyze response:', resp2.json)
