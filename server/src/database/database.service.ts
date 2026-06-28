import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool, QueryResult, QueryResultRow } from 'pg';

/**
 * 薄封装 pg 连接池（沿用 M0 决策：不引 TypeORM，参数化 SQL 直连）。
 * 全局单例，进程退出时关闭连接池。
 */
@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor() {
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }

  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params as never[]);
  }

  onModuleDestroy(): Promise<void> {
    return this.pool.end();
  }
}
