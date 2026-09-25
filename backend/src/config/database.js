const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const env = require('./env');

let dbInstance = null;
let SQL = null;
let inTransaction = false;

function getDbPath() {
  return env.DB_PATH || path.resolve(__dirname, '../../instacoserve.db');
}

function saveDb() {
  if (!dbInstance || inTransaction) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(getDbPath(), buffer);
  } catch (err) {
    console.error('[DB Save Error]', err.message);
  }
}

// Synchronously / eagerly initialize SQLite instance
let initPromise = (async () => {
  if (!SQL) {
    SQL = await initSqlJs();
  }
  const dbFile = getDbPath();
  if (fs.existsSync(dbFile)) {
    try {
      const fileBuffer = fs.readFileSync(dbFile);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (e) {
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
    saveDb();
  }
  try {
    dbInstance.run('PRAGMA foreign_keys = ON;');
  } catch (e) {}
  return dbInstance;
})();

const dbWrapper = {
  async init() {
    await initPromise;
    return this;
  },

  get rawDb() {
    return dbInstance;
  },

  exec(sql) {
    if (!dbInstance) throw new Error('Database not initialized yet');
    dbInstance.exec(sql);
    saveDb();
  },

  run(sql, params = []) {
    if (!dbInstance) throw new Error('Database not initialized yet');
    dbInstance.run(sql, params);
    saveDb();
  },

  pragma(statement) {
    if (!dbInstance) return;
    try {
      dbInstance.run(`PRAGMA ${statement};`);
    } catch (e) {}
  },

  prepare(sql) {
    return {
      run: (...params) => {
        if (!dbInstance) throw new Error('Database not initialized');
        const flattened = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        
        dbInstance.run(sql, flattened);
        
        let lastId = 0;
        let changes = 1;
        try {
          const res = dbInstance.exec('SELECT last_insert_rowid() as id, changes() as count');
          if (res && res[0] && res[0].values && res[0].values[0]) {
            lastId = res[0].values[0][0];
            changes = res[0].values[0][1];
          }
        } catch (e) {}
        
        saveDb();
        return { lastInsertRowid: lastId, changes };
      },

      get: (...params) => {
        if (!dbInstance) throw new Error('Database not initialized');
        const flattened = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        const stmt = dbInstance.prepare(sql);
        try {
          stmt.bind(flattened);
          if (stmt.step()) {
            const row = stmt.getAsObject();
            stmt.free();
            return row;
          }
          stmt.free();
          return undefined;
        } catch (err) {
          try { stmt.free(); } catch(e) {}
          throw err;
        }
      },

      all: (...params) => {
        if (!dbInstance) throw new Error('Database not initialized');
        const flattened = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        const stmt = dbInstance.prepare(sql);
        const rows = [];
        try {
          stmt.bind(flattened);
          while (stmt.step()) {
            rows.push(stmt.getAsObject());
          }
          stmt.free();
          return rows;
        } catch (err) {
          try { stmt.free(); } catch(e) {}
          throw err;
        }
      }
    };
  },

  transaction(fn) {
    return (...args) => {
      inTransaction = true;
      try {
        const result = fn(...args);
        inTransaction = false;
        saveDb();
        return result;
      } catch (err) {
        inTransaction = false;
        throw err;
      }
    };
  }
};

module.exports = dbWrapper;
