import {readFile, writeFile, mkdir, copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = file => readFile(path.join(root, file), 'utf8');
const write = (file, content) => writeFile(path.join(root, 'docs', file), content);
await mkdir(path.join(root, 'docs/vendor'), {recursive: true});
const includes = '<script src="vendor/peerjs.min.js"></script>\n<script src="vendor/qrcode.js"></script>\n<script src="connection.js"></script>\n<script>\n';
for (const name of ['apresentacao.html', 'controle.html']) {
  let html = await read(name);
  const original = /<script>\s*\/\* Canal entre apresentação[\s\S]*?(?=\n\(\(\)=>\{)/;
  if (!original.test(html)) throw new Error('Bloco de conexão não encontrado: ' + name);
  html = html.replace(original, includes);
  html = html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta name="referrer" content="no-referrer">\n<meta name="description" content="Voz do Professor: apresentação interativa com 20 slides e controle pelo celular.">\n<link rel="icon" href="favicon.svg" type="image/svg+xml">');
  if (name === 'apresentacao.html') {
    html = html.replace(/let pairInfo=null;[\s\S]*?(?=if\(link.http\)setTimeout)/, await read('web/pair.js.txt'));
    html = html.replace("s.textContent='Aguardando o celular…';", "s.textContent=link.error||(link.up?'Aguardando o celular…':'Conectando à internet…');");
    html = html.replace("else if(m.t==='go')go(+m.i);", "else if(m.t==='go'&&Number.isInteger(m.i)&&m.i>=0&&m.i<N)go(m.i);");
  } else {
    html = html.replace(/function status\(\)\{[\s\S]*?(?=status\(\);render\(\);)/, await read('web/status.js.txt'));
  }
  await write(name, html);
}
await copyFile(path.join(root, 'web/connection.js'), path.join(root, 'docs/connection.js'));
await copyFile(path.join(root, 'web/LICENSE-qrcode.txt'), path.join(root, 'docs/vendor/LICENSE-qrcode.txt'));
for (const [src, dest] of [
  ['peerjs/dist/peerjs.min.js', 'peerjs.min.js'],
  ['peerjs/LICENSE', 'LICENSE-peerjs.txt'],
  ['qrcode-generator/dist/qrcode.js', 'qrcode.js'],
  ['qrcode-generator/README.md', 'README-qrcode.md']
]) await copyFile(path.join(root, 'node_modules', src), path.join(root, 'docs/vendor', dest));
await write('index.html', '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Voz do Professor</title><meta http-equiv="refresh" content="0;url=apresentacao.html"><script>location.replace("apresentacao.html"+location.search+location.hash)</script></head><body><a href="apresentacao.html">Abrir apresentação Voz do Professor</a></body></html>');
await write('favicon.svg', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#ca0101"/><path d="M16 18h8l8 27 8-27h8L36 50h-8z" fill="white"/></svg>');
await write('.nojekyll', '');
console.log('Versão online gerada em docs/. Os originais locais foram preservados.');
