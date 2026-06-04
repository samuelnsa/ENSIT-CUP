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
    if (line >= 430 && line <= 440) {
      console.log(`push ${ch} at ${line}:${col}`);
    }
    stack.push({ ch, line, col, depth: stack.length + 1 });
  } else if (ch === ')' || ch === '}' || ch === ']') {
    if (line >= 430 && line <= 487) {
      console.log(`pop ${ch} at ${line}:${col}, stack top ${stack.length ? stack[stack.length-1].ch : 'none'}`);
    }
    if (line === 487 && col === 15) {
      console.log('stack before pop at 487: ', JSON.stringify(stack.slice(-10), null, 2));
    }
    const expected = pairs[ch];
    const last = stack.pop();
    if (!last || last.ch !== expected) {
      console.error(`Unmatched close ${ch} at ${line}:${col}, expected ${expected}, got ${last ? last.ch : 'none'}`);
      process.exit(1);
    }
  }
  col++;
}
console.log('finished', stack.length);
