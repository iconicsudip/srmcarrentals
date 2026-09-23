import urllib.request
import re
import json

url = "https://srmcarrentals.com/search-new/?location=Udaipur&location_drop=&pickup_date=18-09-2026&pickup_time=05%3A30+AM&return_date=19-09-2026&return_time=05%3A30+AM&pickup_time=05%3A30+AM&return_time=05%3A30+AM"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"})

try:
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode("utf-8")

    # Let's inspect car cards structure
    cards = re.findall(r'<div[^>]*class="[^"]*car-box[^"]*"[^>]*>(.*?)</div>\s*</div>', html, re.DOTALL)
    print(f"Matched {len(cards)} car boxes")
    
    # Also find all image tags with their surrounding text / alt
    img_matches = re.findall(r'<img[^>]+src=["\']([^"\']+)["\'][^>]*alt=["\']([^"\']*)["\']', html)
    print(f"Total images with alt: {len(img_matches)}")
    for src, alt in img_matches:
        if "uploads" in src and "breadcrumb" not in src:
            print(f"ALT: '{alt}' => SRC: {src}")

except Exception as e:
    print("Error:", e)
