import fs from 'fs';
import path from 'path';

const BASE_DIR = process.cwd();
const DIST_DIR = path.join(BASE_DIR, 'dist');
const ASSETS_DIR = path.join(DIST_DIR, 'assets');

console.log('Building GitWarp with Bun...');

// Clean dist
if (fs.existsSync(DIST_DIR)) {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(ASSETS_DIR, { recursive: true });

// Bundle with Bun
await Bun.build({
  entrypoints: ['./src/main.js'],
  outdir: ASSETS_DIR,
  minify: true,
});

console.log('Copying static assets...');

// Copy index.html and update script/css sources
let indexHtml = fs.readFileSync(path.join(BASE_DIR, 'index.html'), 'utf-8');
indexHtml = indexHtml.replace('src="/src/main.js"', 'src="/assets/main.js"');
indexHtml = indexHtml.replace("src='./src/main.js'", "src='/assets/main.js'"); 
indexHtml = indexHtml.replace('href="/src/style.css"', 'href="/assets/style.css"');
indexHtml = indexHtml.replace("href='./src/style.css'", "href='/assets/style.css'");
fs.writeFileSync(path.join(DIST_DIR, 'index.html'), indexHtml);

// Copy style.css to assets
if (fs.existsSync(path.join(BASE_DIR, 'src', 'style.css'))) {
  fs.copyFileSync(path.join(BASE_DIR, 'src', 'style.css'), path.join(ASSETS_DIR, 'style.css'));
}

// Copy theme.css
if (fs.existsSync(path.join(BASE_DIR, 'theme.css'))) {
  fs.copyFileSync(path.join(BASE_DIR, 'theme.css'), path.join(DIST_DIR, 'theme.css'));
}

// Copy public directory contents
const publicDir = path.join(BASE_DIR, 'public');
if (fs.existsSync(publicDir)) {
  for (const file of fs.readdirSync(publicDir)) {
    fs.copyFileSync(path.join(publicDir, file), path.join(DIST_DIR, file));
  }
}

// Copy Apps-reForged.png if it exists at root
const appImg = path.join(BASE_DIR, 'Apps-reForged.png');
if (fs.existsSync(appImg)) {
    fs.copyFileSync(appImg, path.join(DIST_DIR, 'Apps-reForged.png'));
}

console.log('Build complete!');
