import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';
import { users } from './users.schema';

export const posts = pgTable(
  'posts',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content'),
    imageKey: varchar('image_url', { length: 1024 }),
    likeCount: integer('like_count').notNull().default(0),
    commentCount: integer('comment_count').notNull().default(0),
    isPublic: boolean('is_public').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('posts_feed_cursor_idx').on(
      table.isPublic,
      table.createdAt,
      table.id,
    ),
    index('posts_user_id_created_at_idx').on(table.userId, table.createdAt),
  ],
);
