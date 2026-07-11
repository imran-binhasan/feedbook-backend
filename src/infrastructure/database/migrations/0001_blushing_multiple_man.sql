ALTER TABLE "sessions" ADD COLUMN "token_hash" varchar(64) NOT NULL;--> statement-breakpoint
CREATE INDEX "session_token_hash_idx" ON "sessions" USING btree ("token_hash");--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash");