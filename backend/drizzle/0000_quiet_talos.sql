DO $$ BEGIN
    CREATE TYPE "public"."TxnStatus" AS ENUM('Processing', 'Success', 'Failure');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE "Option" (
	"id" serial PRIMARY KEY NOT NULL,
	"image_url" text NOT NULL,
	"task_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Payouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"amount" double precision NOT NULL,
	"signature" text NOT NULL,
	"status" "TxnStatus" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Submission" (
	"id" serial PRIMARY KEY NOT NULL,
	"worker_id" integer NOT NULL,
	"option_id" integer NOT NULL,
	"task_id" integer NOT NULL,
	"amount" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Task" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text DEFAULT 'Select the most clickable thumbnail',
	"user_id" integer NOT NULL,
	"signature" text NOT NULL,
	"amount" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" serial PRIMARY KEY NOT NULL,
	"address" text NOT NULL,
	CONSTRAINT "User_address_unique" UNIQUE("address")
);
--> statement-breakpoint
CREATE TABLE "Worker" (
	"id" serial PRIMARY KEY NOT NULL,
	"address" text NOT NULL,
	"pending_amount" double precision NOT NULL,
	"locked_amount" double precision NOT NULL,
	CONSTRAINT "Worker_address_unique" UNIQUE("address")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "submission_unique_worker_task" ON "Submission" USING btree ("worker_id","task_id");

