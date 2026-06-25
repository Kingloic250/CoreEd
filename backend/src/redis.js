require('dotenv').config();
const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

class MemoryStore {
  constructor() {
    this._data = new Map();
    this._timers = new Map();
    this._isOpen = true;
  }

  get isOpen() { return this._isOpen; }

  async get(key) {
    const entry = this._data.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this._data.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key, value, mode, ttl) {
    const ttlMs = mode === 'EX' ? ttl * 1000 : mode === 'PX' ? ttl : undefined;
    this._data.set(key, { value, expiresAt: ttlMs ? Date.now() + ttlMs : undefined });
    if (ttlMs) {
      const existing = this._timers.get(key);
      if (existing) clearTimeout(existing);
      this._timers.set(key, setTimeout(() => { this._data.delete(key); this._timers.delete(key); }, ttlMs));
    }
    return 'OK';
  }

  async del(...keys) {
    let count = 0;
    for (const key of keys) {
      if (this._data.has(key)) {
        const timer = this._timers.get(key);
        if (timer) clearTimeout(timer);
        this._data.delete(key);
        count++;
      }
    }
    return count;
  }

  async incr(key) {
    const entry = this._data.get(key);
    const expired = entry && entry.expiresAt && Date.now() > entry.expiresAt;
    if (expired) { this._data.delete(key); }
    const cur = !expired && entry ? entry.value : null;
    const next = String(Number(cur || 0) + 1);
    this._data.set(key, { value: next, expiresAt: expired ? undefined : entry?.expiresAt });
    return Number(next);
  }

  async pexpire(key, ms) {
    const entry = this._data.get(key);
    if (!entry) return 0;
    entry.expiresAt = Date.now() + ms;
    const existing = this._timers.get(key);
    if (existing) clearTimeout(existing);
    this._timers.set(key, setTimeout(() => { this._data.delete(key); this._timers.delete(key); }, ms));
    return 1;
  }

  async expire(key, seconds) {
    return this.pexpire(key, seconds * 1000);
  }

  async ttl(key) {
    const entry = this._data.get(key);
    if (!entry) return -2;
    if (!entry.expiresAt) return -1;
    return Math.max(0, Math.ceil((entry.expiresAt - Date.now()) / 1000));
  }

  async pttl(key) {
    const entry = this._data.get(key);
    if (!entry) return -2;
    if (!entry.expiresAt) return -1;
    return Math.max(0, entry.expiresAt - Date.now());
  }

  _patternToRegex(pattern) {
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
    return new RegExp('^' + escaped + '$');
  }

  async keys(pattern) {
    const regex = this._patternToRegex(pattern);
    return Array.from(this._data.keys()).filter(k => regex.test(k));
  }

  async scan(cursor, ...args) {
    let pattern = '*';
    for (let i = 0; i < args.length; i += 2) {
      if (args[i] === 'MATCH') pattern = args[i + 1];
    }
    const regex = this._patternToRegex(pattern);
    const keys = Array.from(this._data.keys()).filter(k => regex.test(k));
    return ['0', keys];
  }

  on() {}

  async connect() { this._isOpen = true; }
  async quit() {
    for (const t of this._timers.values()) clearTimeout(t);
    this._timers.clear();
    this._data.clear();
  }
}

let client;

async function connectRedis() {
  try {
    client = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
      retryStrategy(times) {
        if (times > 5) return null;
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
      tls: REDIS_URL.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
    });

    client.on('connect', () => console.log('[Redis] Connected'));
    client.on('error', (err) => console.error('[Redis] Error:', err.message));
    client.on('close', () => console.log('[Redis] Connection closed'));

    await client.connect();
    console.log('[Redis] Using Upstash/remote Redis');
  } catch {
    console.warn('[Redis] Connection failed — using in-memory fallback store');
    client = new MemoryStore();
  }
}

const handler = {
  get(_, prop) {
    if (prop === 'then') return undefined;
    const c = client;
    return typeof c?.[prop] === 'function' ? c[prop].bind(c) : c?.[prop];
  },
  set(_, prop, value) {
    if (client) client[prop] = value;
    return true;
  },
};

module.exports = {
  redis: new Proxy({}, handler),
  connectRedis,
};
