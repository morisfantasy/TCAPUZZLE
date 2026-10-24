// Rebuilds public/index.html from src/. Run: npm run build
const fs = require('fs'), path = require('path');
const src = p => path.join(__dirname, 'src', p);
const pieces = JSON.parse(fs.readFileSync(src('data/pieces.json'), 'utf8'));
const logo = 'data:image/png;base64,' + fs.readFileSync(src('data/logo.png')).toString('base64');
const bookCover = 'data:image/webp;base64,' + fs.readFileSync(src('data/white_pawn/cover.b64'), 'utf8').trim();

const wp = src('data/white_pawn');
let bookData = fs.readFileSync(path.join(wp, 'books.js'), 'utf8') + '\n';
for (let i = 1; i <= 10; i++) {
  bookData += fs.readFileSync(path.join(wp, 'ch' + String(i).padStart(2, '0') + '.js'), 'utf8') + '\n';
}
bookData += '\nconst BOOKS=[Object.assign({}, WHITE_PAWN_META, {ch: WHITE_PAWN_CHAPTERS})];\n';

// Validate the imported workbook before shipping it.
const vm = require('vm');
const check = {};
vm.createContext(check);
vm.runInContext(bookData + '\nthis.__book=BOOKS[0];', check);
const ids = check.__book.ch.flatMap(ch => ch.practice.flatMap(p => p.exercises.map(e => e.id)));
if (check.__book.ch.length !== 10 || ids.length !== 300 || ids.some((id, i) => id !== i + 1)) {
  throw new Error('White Pawn import integrity check failed: expected 10 chapters and exercises 1-300.');
}

const data = bookData +
  '\nconst PIECES=' + JSON.stringify(pieces) + ';\nconst LOGO="' + logo + '";\nconst BOOK_COVER="' + bookCover + '";';
const analysisBoardCode = fs.readFileSync(src('analysis_board.js'), 'utf8');
const appCode = fs.readFileSync(src('workbook_app.js'), 'utf8');
const combinedAppCode = analysisBoardCode + '\\n' + appCode;
// Fail the build immediately if the browser application contains a syntax error.
new Function(combinedAppCode);
const html = fs.readFileSync(src('template.html'), 'utf8')
  .replace('/*MINICHESS*/', () => fs.readFileSync(src('minichess.js'), 'utf8'))
  .replace('/*DATA*/', () => data)
  .replace('/*APP*/', () => combinedAppCode);
fs.mkdirSync(path.join(__dirname, 'public'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'public', 'index.html'), html);
console.log('public/index.html built (' + Math.round(html.length / 1024) + ' KB)');
