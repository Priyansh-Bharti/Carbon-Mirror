const fs = require('fs');
const path = require('path');

const jsDir = 'public/js';
const files = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));
const exports = {};

files.forEach(file => {
  const content = fs.readFileSync(path.join(jsDir, file), 'utf8');
  const exportMatches = content.match(/export (?:function|const|class|async function) (\w+)/g) || [];
  exports[file] = exportMatches.map(m => m.replace(/export (?:function|const|class|async function) /, ''));
});

console.log('=== EXPORTS ===');
Object.entries(exports).forEach(([file, exps]) => {
  if (exps.length > 0) console.log(file + ': ' + exps.join(', '));
});

console.log('\n=== IMPORT MISMATCHES ===');
let issues = 0;
files.forEach(file => {
  const content = fs.readFileSync(path.join(jsDir, file), 'utf8');
  const localImportRegex = /import \{([^}]+)\} from ['"]\.\/([^'"]+)['"]/g;
  let match;
  while ((match = localImportRegex.exec(content)) !== null) {
    const importedNames = match[1].split(',').map(n => n.trim()).filter(Boolean);
    const sourceFile = match[2].endsWith('.js') ? match[2] : match[2] + '.js';
    importedNames.forEach(name => {
      const cleanName = name.replace(/\s+as\s+\w+/, '').trim();
      if (exports[sourceFile] && !exports[sourceFile].includes(cleanName)) {
        console.log('MISMATCH: ' + file + ' imports [' + cleanName + '] from ' + sourceFile + ' (not in exports)');
        issues++;
      }
    });
  }
});

if (issues === 0) console.log('No import mismatches found - all local imports are valid.');

// Check localStorage key inventory
console.log('\n=== LOCALSTORAGE KEY INVENTORY ===');
files.forEach(file => {
  const content = fs.readFileSync(path.join(jsDir, file), 'utf8');
  const keys = content.match(/localStorage\.(getItem|setItem|removeItem)\(['"](.*?)['"]/g) || [];
  if (keys.length > 0) {
    console.log(file + ':');
    keys.forEach(k => console.log('  ' + k));
  }
});
