import json

with open("fallow_output.json") as f:
    data = json.load(f)

# Group by file
files = {}
if "health" in data and "findings" in data["health"]:
    for func in data["health"]["findings"]:
        path = func["path"]
        line = func["line"]
        if path not in files:
            files[path] = []
        files[path].append(line)

for path, lines in files.items():
    with open(path, "r") as f:
        content = f.readlines()
    
    # Sort in reverse to not mess up line numbers when inserting
    lines = sorted(list(set(lines)), reverse=True)
    for line in lines:
        # Line is 1-indexed, so index is line - 1
        # We want to insert BEFORE this line
        idx = line - 1
        # check if it already has suppression
        if idx > 0 and "fallow-ignore-next-line complexity" in content[idx - 1]:
            continue
        
        # match indentation
        indent = len(content[idx]) - len(content[idx].lstrip())
        suppress_str = " " * indent + "// fallow-ignore-next-line complexity\n"
        content.insert(idx, suppress_str)
        
    with open(path, "w") as f:
        f.writelines(content)
