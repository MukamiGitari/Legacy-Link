import { neon } from '@neondatabase/serverless';

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/ws') {
      const room = (url.searchParams.get('room') || '').toUpperCase().slice(0, 12);
      if (!room) return new Response('room required', { status: 400 });
      if (req.headers.get('Upgrade') !== 'websocket') return new Response('expected websocket', { status: 426 });
      return env.POOL_ROOM.get(env.POOL_ROOM.idFromName(room)).fetch(req);
    }
    if (url.pathname === '/api/leaderboard') {
      const sql = neon(env.DATABASE_URL);
      const rows = await sql`select winner_name as name, count(*)::int as wins from pool_matches
        where winner_name is not null group by 1 order by wins desc limit 20`;
      return Response.json(rows, { headers: { 'access-control-allow-origin': '*' } });
    }
    return new Response('family-pool ok');
  },
};

// One Durable Object per room code. It only relays shots and tracks whose turn it is;
// both browsers run the same fixed-step physics, so ball positions are never sent.
export class PoolRoom {
  constructor(state, env) {
    this.state = state; this.env = env;
    this.names = [null, null]; this.turn = 0; this.shots = 0; this.room = '';
  }
  async fetch(req) {
    const url = new URL(req.url);
    this.room = (url.searchParams.get('room') || '').toUpperCase();
    const name = (url.searchParams.get('name') || 'Guest').slice(0, 24);
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.state.acceptWebSocket(server);
    let seat = this.names.findIndex(n => n === null);
    if (seat === -1) seat = 2; // spectator
    if (seat < 2) this.names[seat] = name;
    server.serializeAttachment({ seat });
    server.send(JSON.stringify({ t: 'hello', seat, names: this.names, turn: this.turn }));
    this.broadcast({ t: 'names', names: this.names }, server);
    return new Response(null, { status: 101, webSocket: client });
  }
  broadcast(msg, except) {
    const s = JSON.stringify(msg);
    for (const ws of this.state.getWebSockets()) if (ws !== except) { try { ws.send(s); } catch {} }
  }
  async webSocketMessage(ws, raw) {
    let m; try { m = JSON.parse(raw); } catch { return; }
    const { seat } = ws.deserializeAttachment();
    if (m.t === 'shot' && seat === this.turn) {
      this.shots++;
      this.broadcast({ t: 'shot', seat, angle: +m.angle, power: +m.power }, ws);
    } else if (m.t === 'settled' && seat === this.turn) {
      this.turn = m.turn === 1 ? 1 : 0;
      this.broadcast({ t: 'turn', turn: this.turn }, ws);
      if (m.over) await this.finish(this.turn);
    } else if (m.t === 'place' && seat === this.turn) {
      this.broadcast({ t: 'place', x: +m.x, y: +m.y }, ws);
    } else if (m.t === 'reset' && seat < 2) {
      this.turn = 0; this.shots = 0;
      this.broadcast({ t: 'reset' }, ws);
    }
  }
  async finish(winnerSeat) {
    if (!this.names[0] || !this.names[1]) return;
    try {
      const sql = neon(this.env.DATABASE_URL);
      await sql`insert into pool_matches (room_code, player1_name, player2_name, winner_name, shots)
        values (${this.room}, ${this.names[0]}, ${this.names[1]}, ${this.names[winnerSeat]}, ${this.shots})`;
    } catch (e) { console.error('save failed', e); }
  }
  async webSocketClose(ws) {
    const { seat } = ws.deserializeAttachment();
    if (seat < 2) this.names[seat] = null;
    this.broadcast({ t: 'names', names: this.names });
  }
}
