ALTER TABLE "comments" ADD CONSTRAINT "comments_content_check" CHECK ("comments"."content" IS NULL OR length("comments"."content") > 0);--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_like_count_check" CHECK ("comments"."like_count" >= 0);--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_reply_count_check" CHECK ("comments"."reply_count" >= 0);--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_content_check" CHECK ("posts"."content" IS NULL OR length("posts"."content") > 0);--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_like_count_check" CHECK ("posts"."like_count" >= 0);--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_comment_count_check" CHECK ("posts"."comment_count" >= 0);--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_updated_at_check" CHECK ("posts"."updated_at" >= "posts"."created_at");--> statement-breakpoint
ALTER TABLE "replies" ADD CONSTRAINT "replies_content_check" CHECK ("replies"."content" IS NULL OR length("replies"."content") > 0);--> statement-breakpoint
ALTER TABLE "replies" ADD CONSTRAINT "replies_like_count_check" CHECK ("replies"."like_count" >= 0);