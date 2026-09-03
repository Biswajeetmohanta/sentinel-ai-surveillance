import os
import subprocess

SUBMISSION_DIR = r"D:\sentinel-ai-surveillance\submission_package"
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
if not os.path.exists(CHROME_PATH):
    CHROME_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

# Create a clean multi-slide print HTML where all 8 slides are displayed sequentially for printing
slides_html = []
for i in range(1, 9):
    slide_file = os.path.join(SUBMISSION_DIR, "slides_temp", f"slide_{i}.html")
    if os.path.exists(slide_file):
        with open(slide_file, "r", encoding="utf-8") as f:
            content = f.read()
            slides_html.append(content)

# Build a master multi-slide print deck
master_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sentinel AI Surveillance Presentation</title>
  <style>
    @page {{ size: 1920px 1080px; margin: 0; }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{ background: #0b0f19; -webkit-print-color-adjust: exact; }}
    .slide-page {{ width: 1920px; height: 1080px; page-break-after: always; display: block; overflow: hidden; }}
    img {{ width: 1920px; height: 1080px; object-fit: cover; display: block; }}
  </style>
</head>
<body>
"""

for i in range(1, 9):
    img_path = f"slides_temp/slide_{i}.png"
    master_html += f'  <div class="slide-page"><img src="{img_path}"></div>\n'

master_html += "</body></html>"

deck_print_file = os.path.join(SUBMISSION_DIR, "Deck_Print_Master.html")
with open(deck_print_file, "w", encoding="utf-8") as f:
    f.write(master_html)

output_pdf = os.path.join(SUBMISSION_DIR, "01_Sentinel_AI_Solution_Presentation.pdf")
cmd = [
    CHROME_PATH,
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    f"--print-to-pdf={output_pdf}",
    deck_print_file
]
subprocess.run(cmd, capture_output=True)
print(f"Updated 01_Sentinel_AI_Solution_Presentation.pdf ({os.path.getsize(output_pdf)/1024:.1f} KB)")
