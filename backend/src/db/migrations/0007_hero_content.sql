CREATE TABLE "hero_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"eyebrow" varchar(200) DEFAULT '' NOT NULL,
	"title_lead" varchar(200) DEFAULT '' NOT NULL,
	"title_emphasis" varchar(100) DEFAULT '' NOT NULL,
	"title_suffix" varchar(100) DEFAULT '' NOT NULL,
	"title_tagline" varchar(200) DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"cta_primary_label" varchar(120) DEFAULT '' NOT NULL,
	"cta_primary_href" varchar(300) DEFAULT '' NOT NULL,
	"cta_secondary_label" varchar(120) DEFAULT '' NOT NULL,
	"cta_secondary_href" varchar(300) DEFAULT '' NOT NULL,
	"cta_link_label" varchar(120) DEFAULT '' NOT NULL,
	"cta_link_href" varchar(300) DEFAULT '' NOT NULL,
	"kpis" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
