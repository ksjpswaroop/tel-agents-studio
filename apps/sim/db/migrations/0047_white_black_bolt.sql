CREATE TYPE "public"."research_status" AS ENUM('draft', 'thinking', 'planning', 'researching', 'writing', 'completed', 'paused', 'failed');--> statement-breakpoint
CREATE TYPE "public"."research_task_status" AS ENUM('pending', 'searching', 'processing', 'completed', 'failed', 'skipped');--> statement-breakpoint
CREATE TABLE "research_artifact" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"artifact_type" text NOT NULL,
	"format" text NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"file_name" text,
	"file_size" integer,
	"file_path" text,
	"download_url" text,
	"version" integer DEFAULT 1 NOT NULL,
	"is_latest" boolean DEFAULT true NOT NULL,
	"parent_artifact_id" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"share_token" text,
	"download_count" integer DEFAULT 0 NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"last_accessed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research_history" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text NOT NULL,
	"version" integer NOT NULL,
	"description" text,
	"change_type" text NOT NULL,
	"full_state" jsonb NOT NULL,
	"state_diff" jsonb,
	"parent_version_id" text,
	"step_name" text,
	"is_bookmarked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research_knowledge_link" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"knowledge_base_id" text NOT NULL,
	"document_id" text,
	"link_type" text NOT NULL,
	"usage_context" text,
	"relevance_score" numeric(3, 2),
	"access_count" integer DEFAULT 0 NOT NULL,
	"last_accessed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research_session" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"question" text NOT NULL,
	"status" "research_status" DEFAULT 'draft' NOT NULL,
	"ai_config" jsonb DEFAULT '{}' NOT NULL,
	"search_config" jsonb DEFAULT '{}' NOT NULL,
	"current_step" text,
	"state_snapshot" jsonb,
	"report_plan" text,
	"final_report" text,
	"knowledge_graph" text,
	"total_tasks" integer DEFAULT 0 NOT NULL,
	"completed_tasks" integer DEFAULT 0 NOT NULL,
	"total_sources" integer DEFAULT 0 NOT NULL,
	"estimated_duration" integer,
	"actual_duration" integer,
	"is_public" boolean DEFAULT false NOT NULL,
	"allow_collaborators" boolean DEFAULT false NOT NULL,
	"started_at" timestamp,
	"paused_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research_source" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"task_id" text,
	"url" text NOT NULL,
	"title" text,
	"content" text,
	"summary" text,
	"source_type" text DEFAULT 'web' NOT NULL,
	"domain" text,
	"published_at" timestamp,
	"author" text,
	"relevance_score" numeric(3, 2),
	"quality_score" numeric(3, 2),
	"credibility_score" numeric(3, 2),
	"cited_in_report" boolean DEFAULT false NOT NULL,
	"citation_count" integer DEFAULT 0 NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"word_count" integer,
	"tags" jsonb DEFAULT '[]' NOT NULL,
	"is_processed" boolean DEFAULT false NOT NULL,
	"processing_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research_task" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"query" text NOT NULL,
	"research_goal" text,
	"task_type" text DEFAULT 'search' NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"status" "research_task_status" DEFAULT 'pending' NOT NULL,
	"search_provider" text,
	"max_results" integer DEFAULT 5 NOT NULL,
	"search_results" jsonb,
	"analysis" text,
	"key_findings" jsonb,
	"learnings" text,
	"execution_time" integer,
	"result_count" integer DEFAULT 0 NOT NULL,
	"relevance_score" numeric(3, 2),
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "research_artifact" ADD CONSTRAINT "research_artifact_session_id_research_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."research_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_artifact" ADD CONSTRAINT "research_artifact_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_history" ADD CONSTRAINT "research_history_session_id_research_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."research_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_history" ADD CONSTRAINT "research_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_knowledge_link" ADD CONSTRAINT "research_knowledge_link_session_id_research_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."research_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_knowledge_link" ADD CONSTRAINT "research_knowledge_link_knowledge_base_id_knowledge_base_id_fk" FOREIGN KEY ("knowledge_base_id") REFERENCES "public"."knowledge_base"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_knowledge_link" ADD CONSTRAINT "research_knowledge_link_document_id_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_session" ADD CONSTRAINT "research_session_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_session" ADD CONSTRAINT "research_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_source" ADD CONSTRAINT "research_source_session_id_research_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."research_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_source" ADD CONSTRAINT "research_source_task_id_research_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."research_task"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_task" ADD CONSTRAINT "research_task_session_id_research_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."research_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "research_artifact_session_idx" ON "research_artifact" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "research_artifact_session_type_idx" ON "research_artifact" USING btree ("session_id","artifact_type");--> statement-breakpoint
CREATE INDEX "research_artifact_latest_idx" ON "research_artifact" USING btree ("session_id","is_latest");--> statement-breakpoint
CREATE INDEX "research_artifact_user_created_idx" ON "research_artifact" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "research_artifact_share_token_idx" ON "research_artifact" USING btree ("share_token");--> statement-breakpoint
CREATE INDEX "research_artifact_public_idx" ON "research_artifact" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "research_artifact_parent_version_idx" ON "research_artifact" USING btree ("parent_artifact_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "research_history_session_version_idx" ON "research_history" USING btree ("session_id","version");--> statement-breakpoint
CREATE INDEX "research_history_session_created_idx" ON "research_history" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "research_history_bookmarked_idx" ON "research_history" USING btree ("session_id","is_bookmarked");--> statement-breakpoint
CREATE INDEX "research_history_user_created_idx" ON "research_history" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "research_knowledge_session_kb_idx" ON "research_knowledge_link" USING btree ("session_id","knowledge_base_id");--> statement-breakpoint
CREATE INDEX "research_knowledge_session_doc_idx" ON "research_knowledge_link" USING btree ("session_id","document_id");--> statement-breakpoint
CREATE INDEX "research_knowledge_kb_session_idx" ON "research_knowledge_link" USING btree ("knowledge_base_id","session_id");--> statement-breakpoint
CREATE INDEX "research_knowledge_type_idx" ON "research_knowledge_link" USING btree ("session_id","link_type");--> statement-breakpoint
CREATE INDEX "research_knowledge_relevance_idx" ON "research_knowledge_link" USING btree ("session_id","relevance_score");--> statement-breakpoint
CREATE INDEX "research_workspace_user_idx" ON "research_session" USING btree ("workspace_id","user_id");--> statement-breakpoint
CREATE INDEX "research_status_idx" ON "research_session" USING btree ("status");--> statement-breakpoint
CREATE INDEX "research_user_created_idx" ON "research_session" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "research_workspace_status_idx" ON "research_session" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "research_public_idx" ON "research_session" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "research_workspace_updated_idx" ON "research_session" USING btree ("workspace_id","updated_at");--> statement-breakpoint
CREATE INDEX "research_source_session_idx" ON "research_source" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "research_source_session_task_idx" ON "research_source" USING btree ("session_id","task_id");--> statement-breakpoint
CREATE UNIQUE INDEX "research_source_session_url_idx" ON "research_source" USING btree ("session_id","url");--> statement-breakpoint
CREATE INDEX "research_source_relevance_idx" ON "research_source" USING btree ("session_id","relevance_score");--> statement-breakpoint
CREATE INDEX "research_source_cited_idx" ON "research_source" USING btree ("session_id","cited_in_report");--> statement-breakpoint
CREATE INDEX "research_source_domain_idx" ON "research_source" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "research_source_type_idx" ON "research_source" USING btree ("source_type");--> statement-breakpoint
CREATE INDEX "research_source_tags_gin_idx" ON "research_source" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "research_task_session_status_idx" ON "research_task" USING btree ("session_id","status");--> statement-breakpoint
CREATE INDEX "research_task_session_priority_idx" ON "research_task" USING btree ("session_id","priority");--> statement-breakpoint
CREATE INDEX "research_task_session_created_idx" ON "research_task" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "research_task_status_priority_idx" ON "research_task" USING btree ("status","priority");--> statement-breakpoint
CREATE INDEX "research_task_session_completed_idx" ON "research_task" USING btree ("session_id","completed_at");