// Rebuilds public/index.html from src/. Run: npm run build
const fs = require('fs'), path = require('path');
const src = p => path.join(__dirname, 'src', p);
const pieces = JSON.parse(fs.readFileSync(src('data/pieces.json'), 'utf8'));
const logo = 'data:image/png;base64,' + fs.readFileSync(src('data/logo.png')).toString('base64');
const data = fs.readFileSync(src('data/books.js'), 'utf8') +
  '\nconst PIECES=' + JSON.stringify(pieces) + ';\nconst LOGO="' + logo + '";';
const html = fs.readFileSync(src('template.html'), 'utf8')
  .replace('/*MINICHESS*/', () => fs.readFileSync(src('minichess.js'), 'utf8'))
  .replace('/*DATA*/', () => data)
  .replace('/*APP*/', () => fs.readFileSync(src('app.js'), 'utf8'));
fs.mkdirSync(path.join(__dirname, 'public'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'public', 'index.html'), html);
console.log('public/index.html built (' + Math.round(html.length / 1024) + ' KB)');
