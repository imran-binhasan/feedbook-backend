import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  timestamp,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { users } from './users.schema';
import { posts } from './posts.schema';

export const comments = pgTable(
  'comments',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content'),
    imageKey: varchar('image_url', { length: 1024 }),
    likeCount: integer('like_count').notNull().default(0),
    replyCount: integer('reply_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('comments_post_cursor_idx').on(
      table.postId,
      table.createdAt,
      table.id,
    ),
    check('comments_content_check', sql`${table.content} IS NULL OR length(${table.content}) > 0`),
    check('comments_like_count_check', sql`${table.likeCount} >= 0`),
    check('comments_reply_count_check', sql`${table.replyCount} >= 0`),
  ],
);
