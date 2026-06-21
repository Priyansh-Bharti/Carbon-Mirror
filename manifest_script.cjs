const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.firebase') && !file.includes('.git') && !file.includes('coverage') && !file.includes('.vscode')) {
        results = results.concat(walk(file));
      }
    } else {
      if (!file.includes('node_modules') && !file.includes('.firebase') && !file.includes('.git') && !file.includes('coverage') && !file.includes('.vscode')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('.');
files.sort().forEach(f => {
  const stat = fs.statSync(f);
  const size = stat.size;
  let lines = 'binary';
  if (f.endsWith('.js') || f.endsWith('.html') || f.endsWith('.css') || f.endsWith('.json') || f.endsWith('.md') || f.endsWith('.yml')) {
    try {
      const content = fs.readFileSync(f, 'utf8');
      lines = content.split('\n').length;
    } catch(e) {}
  }
  const relativePath = f.replace(/\\/g, '/');
  console.log(`${relativePath} | ${lines} lines | ${size} bytes`);
});
