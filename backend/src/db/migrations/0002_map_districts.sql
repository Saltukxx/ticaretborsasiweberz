CREATE TABLE "map_districts" (
	"slug" varchar(50) PRIMARY KEY NOT NULL,
	"label" varchar(200) NOT NULL,
	"product_line" varchar(300) NOT NULL,
	"daily_volume" varchar(50) NOT NULL,
	"member_count" integer DEFAULT 0 NOT NULL,
	"registration_count" integer DEFAULT 0 NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
