const db = require('../db');

let ensured = false;

async function ensureBannedIpsTable() {
  if (ensured) return;

  await db.query(`
    CREATE TABLE IF NOT EXISTS banned_ips (
      id INT NOT NULL AUTO_INCREMENT,
      ip_address VARCHAR(64) NOT NULL,
      reason VARCHAR(255) NULL,
      created_by INT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_banned_ip (ip_address),
      KEY idx_banned_ips_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  ensured = true;
}

async function isIpBanned(ip) {
  const value = String(ip || '').trim();
  if (!value) return false;

  await ensureBannedIpsTable();
  const [rows] = await db.query('SELECT id FROM banned_ips WHERE ip_address=? LIMIT 1', [value]);
  return Boolean(rows[0]);
}

module.exports = {
  ensureBannedIpsTable,
  isIpBanned,
};
