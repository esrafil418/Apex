CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"role" text DEFAULT 'customer' NOT NULL,
	"display_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_role_known" CHECK ("profiles"."role" in ('customer', 'admin', 'manager', 'editor', 'support', 'analyst'))
);
