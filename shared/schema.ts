import { pgTable, text, serial, integer, boolean, decimal, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Members table
export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  first_name: text("first_name").notNull(),
  last_name: text("last_name").notNull(),
  phone_number: text("phone_number").notNull().unique(),
  address: text("address"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertMemberSchema = createInsertSchema(members).omit({ id: true, created_at: true });
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Member = typeof members.$inferSelect;

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Initiatives table
export const initiatives = pgTable("initiatives", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category_id: integer("category_id").notNull().references(() => categories.id),
  description: text("description"),
  starting_date: timestamp("starting_date").notNull(),
  ending_date: timestamp("ending_date").notNull(),
  donations_goal: decimal("donations_goal", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("upcoming"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Create base schema from database table
const baseInitiativeSchema = createInsertSchema(initiatives).omit({ 
  id: true, 
  created_at: true, 
  status: true 
});

// Create a modified schema with string processing for dates and donations_goal
export const insertInitiativeSchema = z.object({
  title: baseInitiativeSchema.shape.title,
  category_id: baseInitiativeSchema.shape.category_id,
  description: baseInitiativeSchema.shape.description,
  // Accept dates as strings, will be converted to Date on server
  starting_date: z.string(),
  ending_date: z.string(),
  // Accept donations_goal as number or string
  donations_goal: z.union([
    z.number(),
    z.string().transform(val => parseFloat(val))
  ])
});

export type InsertInitiative = z.infer<typeof insertInitiativeSchema>;
export type Initiative = typeof initiatives.$inferSelect;

// Member Initiative relation table (for donors and beneficiaries)
export const memberInitiatives = pgTable("member_initiatives", {
  id: serial("id").primaryKey(),
  member_id: integer("member_id").notNull().references(() => members.id),
  initiative_id: integer("initiative_id").notNull().references(() => initiatives.id),
  role: text("role").notNull(), // "donor" or "beneficiary"
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  participation_date: timestamp("participation_date").defaultNow(),
});

// Original schema from Drizzle
const baseInsertMemberInitiativeSchema = createInsertSchema(memberInitiatives).omit({ 
  id: true,
  participation_date: true
});

// Custom schema with proper type handling for the API
export const insertMemberInitiativeSchema = z.object({
  member_id: z.number(),
  initiative_id: z.number(),
  role: z.string(),
  amount: z.union([
    z.string(), // Already a string
    z.number().transform((val) => val.toString()) // Convert number to string
  ]),
  participation_date: z.string().optional(),
});

export type InsertMemberInitiative = z.infer<typeof insertMemberInitiativeSchema>;
export type MemberInitiative = typeof memberInitiatives.$inferSelect;

// Vault transactions
export const vaultTransactions = pgTable("vault_transactions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // "deposit", "withdraw", "donation", "surplus"
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  initiative_id: integer("initiative_id").references(() => initiatives.id),
  transaction_date: timestamp("transaction_date").defaultNow().notNull(),
});

export const insertVaultTransactionSchema = createInsertSchema(vaultTransactions).omit({ 
  id: true, 
  transaction_date: true 
});

export type InsertVaultTransaction = z.infer<typeof insertVaultTransactionSchema>;
export type VaultTransaction = typeof vaultTransactions.$inferSelect;

// Vault balance (single row table to track current balance)
export const vaultBalance = pgTable("vault_balance", {
  id: serial("id").primaryKey(),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("0"),
});

export const insertVaultBalanceSchema = createInsertSchema(vaultBalance).omit({ id: true });
export type InsertVaultBalance = z.infer<typeof insertVaultBalanceSchema>;
export type VaultBalance = typeof vaultBalance.$inferSelect;

// Relation definitions
export const membersRelations = {
  initiatives: () => ({
    through: memberInitiatives,
    references: initiatives,
  }),
};

export const initiativesRelations = {
  members: () => ({
    through: memberInitiatives,
    references: members,
  }),
  category: (initiative: Initiative) => ({
    categoryId: initiative.category_id,
    reference: categories,
  }),
};

// View schemas for computed data
export const memberViewSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  phone_number: z.string(),
  address: z.string().optional(),
  created_at: z.date(),
  total_donations: z.number().optional(),
  total_beneficiaries: z.number().optional(),
  most_recent_role: z.string().optional(),
  initiatives_count: z.number().optional(),
});

export type MemberView = z.infer<typeof memberViewSchema>;

export const initiativeViewSchema = z.object({
  id: z.number(),
  title: z.string(),
  category_id: z.number(),
  category_name: z.string(),
  description: z.string().optional(),
  status: z.string(),
  starting_date: z.date(),
  ending_date: z.date(),
  donations_goal: z.number(),
  created_at: z.date(),
  total_donors: z.number().optional(),
  total_donations: z.number().optional(),
  total_beneficiaries: z.number().optional(),
  total_beneficiaries_amount: z.number().optional(),
});

export type InitiativeView = z.infer<typeof initiativeViewSchema>;

export const memberInitiativeViewSchema = z.object({
  id: z.number(),
  member_id: z.number(),
  initiative_id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  phone_number: z.string(),
  address: z.string().optional(),
  role: z.string(),
  amount: z.number(),
  participation_date: z.date(),
  initiative_title: z.string().optional(),
  category_name: z.string().optional(),
});

export type MemberInitiativeView = z.infer<typeof memberInitiativeViewSchema>;

// Reports
export const reportFiltersSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  initiativeId: z.number().optional(),
  categoryId: z.number().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  role: z.string().optional(),
  memberId: z.number().optional(),
  status: z.string().optional(),
});

export type ReportFilters = z.infer<typeof reportFiltersSchema>;
