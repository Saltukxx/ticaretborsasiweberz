CREATE TABLE "databank_sync_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" varchar(20) NOT NULL,
	"sections" text[] NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"groups_processed" integer,
	"rows_upserted" integer,
	"charts_processed" integer,
	"error_message" text,
	"meta" jsonb
);
--> statement-breakpoint
CREATE TABLE "price_history_monthly" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"year_month" varchar(7) NOT NULL,
	"side" varchar(10),
	"sale_type" varchar(50),
	"transaction_type" varchar(20),
	"avg_price" numeric(12, 4),
	"low_price" numeric(12, 4),
	"high_price" numeric(12, 4),
	"source" varchar(32) DEFAULT 'databank_chart' NOT NULL,
	CONSTRAINT "price_history_monthly_product_id_commodity_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."commodity_products"("id") ON DELETE no action ON UPDATE no action,
	CONSTRAINT "price_history_monthly_product_month_source" UNIQUE("product_id","year_month","source","transaction_type")
);
--> statement-breakpoint
CREATE INDEX "idx_price_history_monthly_product" ON "price_history_monthly" USING btree ("product_id","year_month");
--> statement-breakpoint
CREATE TABLE "market_volume_monthly" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"year" varchar(4) NOT NULL,
	"chart_key" varchar(120) NOT NULL,
	"series_name" varchar(120) NOT NULL,
	"payload" jsonb NOT NULL,
	"source" varchar(32) DEFAULT 'databank_volume' NOT NULL,
	CONSTRAINT "market_volume_monthly_key" UNIQUE("year","chart_key","series_name","source")
);
--> statement-breakpoint
CREATE INDEX "idx_market_volume_monthly_year" ON "market_volume_monthly" USING btree ("year");
