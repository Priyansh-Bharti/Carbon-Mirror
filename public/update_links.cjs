const fs = require('fs');
const files = ['index.html', 'forest.html', 'dashboard.html', 'coach.html', 'card.html', 'actions.html'];
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/style="([^"]*text-decoration: none;)"(\s+id="nav-link-(?:dashboard|actions|coach|share)")/g, 'style="$1 display: none;"$2');
  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated ' + file);
}
