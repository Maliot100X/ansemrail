ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_verify_code text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_verify_expiry timestamp;
--> statement-breakpoint
