import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
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
  ],
);
