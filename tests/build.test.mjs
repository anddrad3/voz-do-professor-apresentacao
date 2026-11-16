import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {Script} from 'node:vm';
import path from 'node:path';

for (const name of ['apresentacao.html', 'controle.html']) {
  test(name + ': scripts compilam e dependências existem', () => {
    const html = readFileSync('docs/' + name, 'utf8');
    for (const script of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
      const src = script[1].match(/src="([^"]+)"/);
      if (src) assert.ok(existsSync(path.join('docs', src[1])), src[1]);
      else new Script(script[2], {filename: name});
    }
    assert.ok(!html.includes('api/events'));
    assert.ok(!html.includes("fetch('api/info')"));
    const original = readFileSync(name, 'utf8');
    const slides = content => JSON.parse(content.match(/const SLIDES=(\[[^\n]+\])[,;]/)[1]);
    assert.deepEqual(slides(html), slides(original), 'preservar integralmente o roteiro');
    assert.equal(slides(html).length, 20);
  });
}
test('apresentação preserva os 20 slides e suas imagens', () => {
  const original = readFileSync('apresentacao.html', 'utf8');
  const output = readFileSync('docs/apresentacao.html', 'utf8');
  assert.equal([...output.matchAll(/<section class="slide /g)].length, 20);
  assert.deepEqual([...output.matchAll(/src="(data:[^"]+)"/g)].map(m=>m[1]),
    [...original.matchAll(/src="(data:[^"]+)"/g)].map(m=>m[1]));
});
