const fs = require('fs');
const src = fs.readFileSync('src/app/pages/Admin.tsx', 'utf8');
let inString = false;
let quote = null;
let escaped = false;
let line = 1;
let col = 1;
const stack = [];
const pairs = { ')': '(', '}': '{', ']': '[' };
for (let i = 0; i < src.length; i++) {
  const ch = src[i];
  if (ch === '\n') {
    line++;
    col = 1;
    continue;
  }
  if (escaped) {
    escaped = false;
    col++;
    continue;
  }
  if (inString) {
    if (ch === '\\') {
      escaped = true;
    } else if (ch === quote) {
      inString = false;
      quote = null;
    }
    col++;
    continue;
  }
  if (ch === '"' || ch === "'" || ch === '`') {
    inString = true;
    quote = ch;
    col++;
    continue;
  }
  if (ch === '(' || ch === '{' || ch === '[') {
    stack.push({ ch, line, col });
  } else if (ch === ')' || ch === '}' || ch === ']') {
    const expected = pairs[ch];
    const last = stack.pop();
    if (!last || last.ch !== expected) {
      console.error(`Unmatched close ${ch} at ${line}:${col}, expected matching ${expected}, got ${last ? last.ch : 'none'}`);
      process.exit(1);
    }
  }
  col++;
}
if (stack.length) {
  console.error('Unmatched opens remain:', stack.slice(-10));
  process.exit(1);
} else {
  console.log('Balanced.');
}
