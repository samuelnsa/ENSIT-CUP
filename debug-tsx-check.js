const fs = require('fs');
const src = fs.readFileSync('src/app/pages/Admin.tsx', 'utf8');
let inString = false;
let quote = null;
let escaped = false;
const counts = { '(': 0, ')': 0, '{': 0, '}': 0, '[': 0, ']': 0 };
for (let i = 0; i < src.length; i++) {
  const ch = src[i];
  if (escaped) {
    escaped = false;
    continue;
  }
  if (inString) {
    if (ch === '\\') {
      escaped = true;
    } else if (ch === quote) {
      inString = false;
      quote = null;
    }
    continue;
  }
  if (ch === '"' || ch === "'") {
    inString = true;
    quote = ch;
    continue;
  }
  if (ch in counts) counts[ch]++;
}
console.log(JSON.stringify(counts, null, 2));
