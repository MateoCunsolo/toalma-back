/**
 * Crea las tablas VENTA y VENTA_DETALLE si no existen.
 * Uso (desde la carpeta backend): npm run db:ventas
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  };

  if (!config.host || !config.user || !config.database) {
    console.error('Faltan DB_HOST, DB_USER o DB_NAME en .env');
    process.exit(1);
  }

  const sqlPath = path.join(__dirname, 'schema-ventas.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  let conn;
  try {
    conn = await mysql.createConnection(config);
    await conn.query(sql);
    console.log('✅ Tablas VENTA / VENTA_DETALLE listas (schema-ventas.sql aplicado).');
  } catch (err) {
    console.error('❌ Error al aplicar el schema:', err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

main();
