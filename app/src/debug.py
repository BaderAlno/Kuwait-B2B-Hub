import re
import os
for root, dirs, files in os.walk('.'):
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path) as f:
                content = f.read()
                # Find any useTranslations 
                hooks = re.findall(r"const\s+(\w+)\s*=\s*useTranslations\((.*?)\)", content)
                if hooks:
                    for v, ns in hooks:
                        calls = re.findall(fr"{v}\((['\"])(.*?)\1", content)
                        if calls:
                            print(f"{path} | {v} | {ns} | {calls[:5]}")
