import requests
import re

s = requests.Session()
login_res = s.post('https://cctv.corp8.cloud/auth/login', data={'email': 'jyoti@deventtechnology.com', 'password': 'CBUB-226S-HMZ9'}, timeout=8)
print('Login status:', login_res.status_code)
r = s.get('https://cctv.corp8.cloud/', timeout=8)
print('HTML length:', len(r.text))

# Let's find script sources or video elements
scripts = re.findall(r'<script[^>]*src=[\'"]([^\'"]+)[\'"]', r.text)
print('Scripts:', scripts)

# Let's inspect first 1000 characters
print('HTML Sample:\n', r.text[:1000])

# Look for camera grid markup
with open('scratch/portal.html', 'w', encoding='utf-8') as f:
    f.write(r.text)
print('Saved portal.html')
