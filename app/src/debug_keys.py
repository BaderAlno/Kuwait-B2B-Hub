import json
import re
import os

path = 'src/app/brands/[id]/page.tsx'
content = open(path).read()
hooks = re.findall(r"const\s+(\w+)\s*=\s*useTranslations\(\s*['\"]([^'\"]+)['\"]\s*\)", content)
print(f"Hooks found: {hooks}")
var_to_ns = {v: ns for v, ns in hooks}
calls = re.findall(r"(\w+)\(\s*['\"]([^'\"]+)\s*['\"]\s*[,)]", content)
print(f"Calls found (first 5): {calls[:5]}")
