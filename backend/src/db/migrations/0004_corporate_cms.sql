CREATE TABLE "corporate_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"eyebrow" varchar(200) DEFAULT '' NOT NULL,
	"heading" varchar(500) DEFAULT '' NOT NULL,
	"lead" text DEFAULT '' NOT NULL,
	"mission" text DEFAULT '' NOT NULL,
	"vision" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "corporate_milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"year" varchar(10) NOT NULL,
	"title" varchar(300) NOT NULL,
	"description" text NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
