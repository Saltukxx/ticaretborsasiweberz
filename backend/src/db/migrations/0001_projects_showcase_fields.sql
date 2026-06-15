ALTER TABLE "projects" ADD COLUMN "field" varchar(200);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "progress" smallint;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "target_label" varchar(100);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "phase_label" varchar(100);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "phases" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "outputs" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "icon" varchar(20);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "year" varchar(10);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "impact" varchar(500);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "result" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "metric" jsonb;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "sort_order" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE "projects" SET "status" = 'ongoing' WHERE "status" = 'active';--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "status" SET DEFAULT 'ongoing';
