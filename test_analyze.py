import fitz  # PyMuPDF
from io import BytesIO
import requests

# Create a test PDF
doc = fitz.open()
page = doc.new_page()
page.insert_text((50, 50), "Test Resume\nSkills: Python, React, JavaScript, Django")
pdf_bytes = BytesIO()
doc.save(pdf_bytes)
pdf_bytes.seek(0)

# Test the analyze endpoint
files = {'resume': ('test.pdf', pdf_bytes, 'application/pdf')}
data = {'role': 'Backend Developer'}

response = requests.post('http://127.0.0.1:5000/analyze', files=files, data=data)
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")
