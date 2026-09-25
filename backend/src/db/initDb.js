const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function initDb() {
  await db.init();
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  
  db.exec(schemaSql);
  return true;
}

if (require.main === module) {
  initDb().then(() => {
    console.log('Database schema initialized successfully.');
  }).catch((err) => {
    console.error('Database init error:', err);
  });
}

module.exports = initDb;
