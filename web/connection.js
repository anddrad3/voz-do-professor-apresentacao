/* Transporte da edição online. O conteúdo dos slides permanece nos HTML originais. */
'use strict';
function createLink(role, onMsg, onStatus) {
  const params = new URLSearchParams(location.hash.slice(1));
  const validId = value => typeof value === 'string' && /^[a-zA-Z0-9-]{10,80}$/.test(value);
  const randomId = () => crypto.randomUUID();
  const room = role === 'show' ? 'vdp-' + randomId() : params.get('session');
  const key = role === 'show' ? randomId() : params.get('key');
  const enabled = role === 'show' || (validId(room) && validId(key));
  const connections = new Set();
  let peer = null, pending = null, retry = null, stopped = false, lastState = null;
  let signalUp = false, error = '', up = false;
  const remoteURL = new URL('controle.html', location.href);
  remoteURL.hash = new URLSearchParams({session: room || '', key: key || ''}).toString();

  function report() {
    up = connections.size > 0 || signalUp;
    onMsg({t: 'peers', shows: role === 'remote' ? connections.size : 1,
      remotes: role === 'show' ? connections.size : 0});
    onStatus?.({server: up, error});
  }
  function validMessage(m) {
    if (!m || typeof m !== 'object' || Array.isArray(m)) return false;
    if (role === 'remote') return m.t === 'state' && Number.isInteger(m.i) && m.i >= 0 && m.i < 20;
    if (['hello', 'next', 'prev'].includes(m.t)) return true;
    if (m.t === 'go') return Number.isInteger(m.i) && m.i >= 0 && m.i < 20;
    return m.t === 'act' && typeof m.a === 'string' && m.a.length < 60 && /^[a-z0-9:_-]+$/.test(m.a);
  }
  function sendTo(conn, m) {
    if (!conn.open) return;
    try { conn.send(m); } catch (_) { drop(conn); }
  }
  function drop(conn) {
    clearTimeout(conn._vdpTimeout);
    connections.delete(conn);
    if (pending === conn) pending = null;
    // Remove first: close can synchronously emit another close event.
    if (!conn._vdpClosed) { conn._vdpClosed = true; conn.close(); }
    report();
    if (role === 'remote') scheduleRetry();
  }
  function attach(conn) {
    if (role === 'show' && (conn.metadata?.key !== key || conn.metadata?.role !== 'remote')) {
      conn.close(); return;
    }
    conn._vdpTimeout = setTimeout(() => drop(conn), 12000);
    conn.on('open', () => {
      if (conn._vdpClosed) return;
      clearTimeout(conn._vdpTimeout);
      if (pending === conn) pending = null;
      conn._vdpLastSeen = Date.now();
      connections.add(conn); error = ''; report();
      if (role === 'show' && lastState) sendTo(conn, lastState);
      if (role === 'remote') sendTo(conn, {t: 'hello'});
    });
    conn.on('data', m => {
      conn._vdpLastSeen = Date.now();
      if (!connections.has(conn)) return;
      if (m?.t === 'ping') { sendTo(conn, {t: 'pong'}); return; }
      if (m?.t === 'pong') return;
      if (validMessage(m)) onMsg(m);
    });
    conn.on('close', () => drop(conn));
    conn.on('error', () => drop(conn));
  }
  function connect() {
    if (stopped || !enabled || role !== 'remote' || !peer?.open || pending || connections.size) return;
    pending = peer.connect(room, {reliable: true, serialization: 'json', metadata: {role: 'remote', key}});
    attach(pending);
  }
  function scheduleRetry() {
    if (stopped || !enabled || retry) return;
    retry = setTimeout(() => {
      retry = null;
      if (!peer || peer.destroyed) start();
      else if (peer.disconnected) { try { peer.reconnect(); } catch (_) { scheduleRetry(); } }
      else connect();
    }, 4000);
  }
  function start() {
    if (stopped || !enabled) return;
    if (typeof Peer !== 'function') {
      error = 'Não foi possível carregar a conexão. Recarregue a página.'; report(); return;
    }
    try { peer = new Peer(role === 'show' ? room : undefined, {debug: 0, secure: true}); }
    catch (_) { error = 'Este navegador não oferece a conexão necessária. Use Chrome, Edge, Firefox ou Safari atualizado.'; report(); return; }
    peer.on('open', () => { signalUp = true; error = ''; report(); connect(); });
    peer.on('connection', conn => { if (role === 'show') attach(conn); else conn.close(); });
    peer.on('disconnected', () => { signalUp = false; report(); scheduleRetry(); });
    peer.on('close', () => { signalUp = false; report(); scheduleRetry(); });
    peer.on('error', err => {
      error = err.type === 'peer-unavailable'
        ? 'A apresentação não está disponível. Mantenha a aba aberta no computador e escaneie o QR code atual.'
        : 'A conexão não respondeu. Confira a internet; se necessário, use o mesmo Wi-Fi ou o hotspot do celular.';
      signalUp = !!peer.open;
      if (pending) drop(pending);
      report(); scheduleRetry();
    });
  }
  const heartbeat = setInterval(() => {
    for (const conn of connections) {
      if (Date.now() - conn._vdpLastSeen > 16000) drop(conn);
      else sendTo(conn, {t: 'ping'});
    }
    if (enabled && !signalUp) scheduleRetry();
    if (role === 'remote' && !connections.size) connect();
  }, 4000);
  addEventListener('online', () => { connect(); scheduleRetry(); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') { connect(); scheduleRetry(); }
  });
  // Defer callbacks until the slide/controller script has finished initializing.
  setTimeout(start, 0);
  addEventListener('pagehide', event => {
    if (event.persisted) return;
    stopped = true; clearInterval(heartbeat); clearTimeout(retry); peer?.destroy();
  });
  return {
    http: enabled, online: true,
    get up() { return up; },
    get error() { return error; },
    url: remoteURL.href,
    send(m) {
      if (role === 'show' && m.t === 'state') lastState = {...m};
      for (const conn of connections) sendTo(conn, m);
    }
  };
}
