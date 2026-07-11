import { pgTable, uuid, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { users } from "./users.schema";
import { replies } from "./replies.schema";

export const replyLikes = pgTable('reply_likes', {
  replyId: uuid('reply_id').notNull().references(() => replies.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.replyId, table.userId] }),
]);