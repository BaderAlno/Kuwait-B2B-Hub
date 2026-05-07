import re
path = 'src/app/brands/[id]/page.tsx'
content = open(path).read()
hook_re = r"const\s+(\w+)\s*=\s*useTranslations\(\s*['\"]([^'\"]+)['\"]\s*\)"
hooks = re.findall(hook_re, content)
print(f"Hooks found: {hooks}")
for v, ns in hooks:
    call_re = rf"{v}\(\s*['\"]([^'\"]+)['\"]\s*[,)]"
    calls = re.findall(call_re, content)
    print(f"Calls found for {v} ({ns}): {calls[:10]}")
