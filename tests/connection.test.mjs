import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {EventEmitter} from 'node:events';
import {randomUUID} from 'node:crypto';

const source = readFileSync('web/connection.js', 'utf8');
class Connection extends EventEmitter {
  open = false;
  sent = [];
  constructor(metadata) { super(); this.metadata = metadata; }
  send(data) { this.sent.push(data); }
  close() { if (this.closed) return; this.closed = true; this.open = false; this.emit('close'); }
  establish() { this.open = true; this.emit('open'); }
}
function setup(role = 'show', hash = '') {
  let peer;
  const tasks = new Map(), messages = [], statuses = [];
  let taskId = 0;
  class Peer extends EventEmitter {
    constructor(id) { super(); this.id = id; this.open = true; peer = this; }
    connect(id, options) { this.destination = id; return this.outgoing = new Connection(options.metadata); }
    destroy() { this.destroyed = true; }
  }
  const context = {location: {href: 'https://example.com/project/apresentacao.html' + hash, hash},
    URL, URLSearchParams, crypto: {randomUUID}, Peer, console,
    setTimeout: (fn, ms) => { const id = ++taskId; tasks.set(id, {fn, ms}); return id; },
    clearTimeout: id => tasks.delete(id), setInterval: () => 1, clearInterval() {},
    addEventListener() {}, document: {addEventListener() {}},
    onMsg: m => messages.push(m), onStatus: s => statuses.push(s)};
  runInNewContext(source, context);
  const link = context.createLink(role, context.onMsg, context.onStatus);
  for (const [id, task] of tasks) if (task.ms === 0) { tasks.delete(id); task.fn(); }
  const credentials = new URLSearchParams(new URL(link.url).hash.slice(1));
  return {link, get peer() {return peer;}, messages, statuses, tasks, credentials};
}
test('sessões isoladas e links relativos ao caminho do GitHub Pages', () => {
  const a = setup(), b = setup();
  assert.notEqual(a.link.url, b.link.url);
  assert.equal(new URL(a.link.url).pathname, '/project/controle.html');
  assert.equal(a.credentials.get('session'), a.peer.id);
  assert.ok(a.credentials.get('key').length >= 36);
});
test('rejeita conexões sem a chave da sessão', () => {
  const app = setup();
  const conn = new Connection({role: 'remote', key: 'incorreta'});
  app.peer.emit('connection', conn);
  assert.equal(conn.closed, true);
});
test('sincroniza estado, aceita comandos válidos e rejeita índices inválidos', () => {
  const app = setup();
  app.link.send({t: 'state', i: 6, n: 20});
  const conn = new Connection({role: 'remote', key: app.credentials.get('key')});
  app.peer.emit('connection', conn); conn.establish();
  assert.equal(conn.sent[0].i, 6);
  conn.emit('data', {t: 'next'});
  conn.emit('data', {t: 'go', i: 19});
  const before = app.messages.length;
  for (const i of [-1, 20, NaN, '2', 1.5]) conn.emit('data', {t: 'go', i});
  conn.emit('data', {t: 'act', a: '<script>'});
  assert.equal(app.messages.length, before);
  assert.equal(app.messages.at(-1).i, 19);
  conn.close();
  assert.equal(app.messages.at(-1).remotes, 0);
});
test('controle reconecta e não executa mensagens que não sejam estado', () => {
  const show = setup();
  const remote = setup('remote', new URL(show.link.url).hash);
  remote.peer.emit('open');
  assert.equal(remote.peer.destination, show.peer.id);
  const conn = remote.peer.outgoing; conn.establish();
  assert.equal(conn.sent.at(-1).t, 'hello');
  conn.emit('data', {t: 'state', i: 8, n: 20});
  assert.equal(remote.messages.at(-1).i, 8);
  const count = remote.messages.length;
  conn.emit('data', {t: 'go', i: 9});
  assert.equal(remote.messages.length, count);
  conn.close();
  assert.equal(remote.messages.at(-1).shows, 0);
  const retry = [...remote.tasks.values()].find(t=>t.ms===4000);
  assert.ok(retry); retry.fn();
  assert.notEqual(remote.peer.outgoing, conn);
});
test('controle sem sessão funciona em modo leitura sem procurar servidor', () => {
  const app = setup('remote');
  assert.equal(app.link.http, false);
  assert.equal(app.peer, undefined);
});
