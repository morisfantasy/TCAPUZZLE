// Rebuilds public/index.html from src/. Run: npm run build
const fs = require('fs'), path = require('path');
const src = p => path.join(__dirname, 'src', p);
const pieces = JSON.parse(fs.readFileSync(src('data/pieces.json'), 'utf8'));
const logo = 'data:image/png;base64,' + fs.readFileSync(src('data/logo.png')).toString('base64');

const wp = src('data/white_pawn');
let bookData = fs.readFileSync(path.join(wp, 'books.js'), 'utf8') + '\n';
for (let i = 1; i <= 10; i++) {
  bookData += fs.readFileSync(path.join(wp, 'ch' + String(i).padStart(2, '0') + '.js'), 'utf8') + '\n';
}
bookData += '\nconst BOOKS=[Object.assign({}, WHITE_PAWN_META, {ch: WHITE_PAWN_CHAPTERS})];\n';

const data = bookData +
  '\nconst PIECES=' + JSON.stringify(pieces) + ';\nconst LOGO="' + logo + '";';
const html = fs.readFileSync(src('template.html'), 'utf8')
  .replace('/*MINICHESS*/', () => fs.readFileSync(src('minichess.js'), 'utf8'))
  .replace('/*DATA*/', () => data)
  .replace('/*APP*/', () => fs.readFileSync(src('workbook_app.js'), 'utf8'));
fs.mkdirSync(path.join(__dirname, 'public'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'public', 'index.html'), html);
console.log('public/index.html built (' + Math.round(html.length / 1024) + ' KB)');
