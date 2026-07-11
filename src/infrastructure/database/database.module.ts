import { Global, Inject, Module, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { DRIZZLE } from './database-connection';
import type { DrizzleDB } from './database-connection';

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): DrizzleDB => {
        const pool = new Pool({
          connectionString: configService.getOrThrow<string>('DATABASE_URL'),
        });
        return drizzle(pool, { schema });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule implements OnModuleInit {
  private readonly logger = new Logger(DatabaseModule.name);

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async onModuleInit() {
    try {
      await this.db.execute('select 1');
      this.logger.log('Database connection established successfully.');
    } catch (error) {
      this.logger.error('Error connecting to the database', error);
      throw error;
    }
  }
}
