CREATE INDEX "comment_likes_likers_idx" ON "comment_likes" USING btree ("comment_id","created_at");--> statement-breakpoint
CREATE INDEX "post_likes_likers_idx" ON "post_likes" USING btree ("post_id","created_at");--> statement-breakpoint
CREATE INDEX "reply_likes_likers_idx" ON "reply_likes" USING btree ("reply_id","created_at");