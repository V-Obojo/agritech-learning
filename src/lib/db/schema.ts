import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import type { Progress } from "../progress";
import type { MetricEvent } from "../metrics";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(), email: text("email").notNull().unique(), name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(), state: text("state"), intention: text("intention"), theme: text("theme"),
  createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull(),
}, table=>[check("users_email_lowercase",sql`${table.email} = lower(${table.email})`)]);
const userId = () => text("user_id").notNull().references(()=>users.id,{onDelete:"cascade"});
export const progress = sqliteTable("progress", {
  userId: userId().primaryKey(), data: text("data",{mode:"json"}).$type<Progress>().notNull(), updatedAt: text("updated_at").notNull(),
});
export const events = sqliteTable("events", {
  id: text("id").primaryKey(), userId: userId(), name: text("name").notNull(),
  details: text("details",{mode:"json"}).$type<MetricEvent["details"]>().notNull(), createdAt: text("created_at").notNull(),
}, table=>[index("events_user_created").on(table.userId,table.createdAt),uniqueIndex("events_user_name_at").on(table.userId,table.name,table.createdAt)]);
export const dashboardPrefs = sqliteTable("dashboard_prefs", {
  userId: userId().primaryKey(), widgets: text("widgets",{mode:"json"}).$type<unknown[]>().notNull(), updatedAt: text("updated_at").notNull(),
});
export const guideHistory = sqliteTable("guide_history", {
  id: text("id").primaryKey(), userId: userId(), subjectId: text("subject_id").notNull(), topicId: text("topic_id").notNull(),
  question: text("question").notNull(), answer: text("answer").notNull(), supported: integer("supported",{mode:"boolean"}).notNull(),
  citations: text("citations",{mode:"json"}).$type<{chunkId:string;title:string}[]>().notNull(), createdAt: text("created_at").notNull(),
});
