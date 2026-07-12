import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { users } from './users.schema';
import { comments } from './comments.schema';

export const replies = pgTable(
  'replies',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    commentId: uuid('comment_id')
      .notNull()
      .references(() => comments.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content'),
    likeCount: integer('like_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('replies_comment_cursor_idx').on(
      table.commentId,
      table.createdAt,
      table.id,
    ),
    check('replies_content_check', sql`${table.content} IS NULL OR length(${table.content}) > 0`),
    check('replies_like_count_check', sql`${table.likeCount} >= 0`),
  ],
);
