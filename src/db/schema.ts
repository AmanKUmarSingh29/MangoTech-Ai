import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  filename: text("filename").notNull(),
  content: text("content").notNull(),
  fileSize: integer("file_size").notNull().default(0),
  pageCount: integer("page_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const summaries = pgTable("summaries", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id")
    .references(() => documents.id, { onDelete: "cascade" })
    .notNull(),
  content: text("content").notNull(),
  keyPoints: jsonb("key_points").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id")
    .references(() => documents.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  questions: jsonb("questions")
    .$type<
      {
        id: number;
        question: string;
        options: string[];
        correctAnswer: number;
        explanation: string;
      }[]
    >()
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id")
    .references(() => quizzes.id, { onDelete: "cascade" })
    .notNull(),
  documentId: integer("document_id")
    .references(() => documents.id, { onDelete: "cascade" })
    .notNull(),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  answers: jsonb("answers")
    .$type<{ questionId: number; selected: number; correct: boolean }[]>()
    .notNull(),
  timeTaken: integer("time_taken").notNull().default(0),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const qaMessages = pgTable("qa_messages", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id")
    .references(() => documents.id, { onDelete: "cascade" })
    .notNull(),
  role: text("role").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
