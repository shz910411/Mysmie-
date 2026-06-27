/**
 * 迁移运行器：顺序应用 migrations/*.sql，用 _migrations 账本表跳过已应用文件。
 * 幂等：第二次运行只 skip、不重复执行、退出码 0。
 * 用法：DATABASE_URL=... npm run migrate （或在 server/.env 配 DATABASE_URL）
 */
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';

loadEnv(); // 若存在 .env 则加载；已存在的 process.env 不被覆盖

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('[migrate] 缺少 DATABASE_URL，无法连接数据库。请在环境变量或 server/.env 配置后重试。');
    process.exit(1);
  }

  const client = new Client({ connectionString: url });
  await client.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        filename   TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const dir = join(__dirname, '..', 'migrations');
    const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();

    const { rows } = await client.query<{ filename: string }>('SELECT filename FROM _migrations');
    const applied = new Set(rows.map((r) => r.filename));

    let appliedCount = 0;
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`[migrate] skip  ${file}`);
        continue;
      }
      const sql = readFileSync(join(dir, file), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations(filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`[migrate] apply ${file}`);
        appliedCount++;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }

    console.log(`[migrate] 完成：本次应用 ${appliedCount} 个，跳过 ${files.length - appliedCount} 个，共 ${files.length} 个迁移文件。`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('[migrate] 失败：', err);
  process.exit(1);
});
