var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  categories: () => categories,
  initiativeViewSchema: () => initiativeViewSchema,
  initiatives: () => initiatives,
  initiativesRelations: () => initiativesRelations,
  insertCategorySchema: () => insertCategorySchema,
  insertInitiativeSchema: () => insertInitiativeSchema,
  insertMemberInitiativeSchema: () => insertMemberInitiativeSchema,
  insertMemberSchema: () => insertMemberSchema,
  insertVaultBalanceSchema: () => insertVaultBalanceSchema,
  insertVaultTransactionSchema: () => insertVaultTransactionSchema,
  memberInitiativeViewSchema: () => memberInitiativeViewSchema,
  memberInitiatives: () => memberInitiatives,
  memberViewSchema: () => memberViewSchema,
  members: () => members,
  membersRelations: () => membersRelations,
  reportFiltersSchema: () => reportFiltersSchema,
  vaultBalance: () => vaultBalance,
  vaultTransactions: () => vaultTransactions
});
import { pgTable, text, serial, integer, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var members = pgTable("members", {
  id: serial("id").primaryKey(),
  first_name: text("first_name").notNull(),
  last_name: text("last_name").notNull(),
  phone_number: text("phone_number").notNull().unique(),
  address: text("address"),
  created_at: timestamp("created_at").defaultNow().notNull()
});
var insertMemberSchema = createInsertSchema(members).omit({ id: true, created_at: true });
var categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique()
});
var insertCategorySchema = createInsertSchema(categories).omit({ id: true });
var initiatives = pgTable("initiatives", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category_id: integer("category_id").notNull().references(() => categories.id),
  description: text("description"),
  starting_date: timestamp("starting_date").notNull(),
  ending_date: timestamp("ending_date").notNull(),
  donations_goal: decimal("donations_goal", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("upcoming"),
  created_at: timestamp("created_at").defaultNow().notNull()
});
var baseInitiativeSchema = createInsertSchema(initiatives).omit({
  id: true,
  created_at: true,
  status: true
});
var insertInitiativeSchema = z.object({
  title: baseInitiativeSchema.shape.title,
  category_id: baseInitiativeSchema.shape.category_id,
  description: baseInitiativeSchema.shape.description,
  // Accept dates as strings, will be converted to Date on server
  starting_date: z.string(),
  ending_date: z.string(),
  // Accept donations_goal as number or string
  donations_goal: z.union([
    z.number(),
    z.string().transform((val) => parseFloat(val))
  ])
});
var memberInitiatives = pgTable("member_initiatives", {
  id: serial("id").primaryKey(),
  member_id: integer("member_id").notNull().references(() => members.id),
  initiative_id: integer("initiative_id").notNull().references(() => initiatives.id),
  role: text("role").notNull(),
  // "donor" or "beneficiary"
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  participation_date: timestamp("participation_date").defaultNow()
});
var baseInsertMemberInitiativeSchema = createInsertSchema(memberInitiatives).omit({
  id: true,
  participation_date: true
});
var insertMemberInitiativeSchema = z.object({
  member_id: z.number(),
  initiative_id: z.number(),
  role: z.string(),
  amount: z.union([
    z.string(),
    // Already a string
    z.number().transform((val) => val.toString())
    // Convert number to string
  ]),
  participation_date: z.string().optional()
});
var vaultTransactions = pgTable("vault_transactions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  // "deposit", "withdraw", "donation", "surplus"
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  initiative_id: integer("initiative_id").references(() => initiatives.id),
  transaction_date: timestamp("transaction_date").defaultNow().notNull()
});
var insertVaultTransactionSchema = createInsertSchema(vaultTransactions).omit({
  id: true,
  transaction_date: true
});
var vaultBalance = pgTable("vault_balance", {
  id: serial("id").primaryKey(),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("0")
});
var insertVaultBalanceSchema = createInsertSchema(vaultBalance).omit({ id: true });
var membersRelations = {
  initiatives: () => ({
    through: memberInitiatives,
    references: initiatives
  })
};
var initiativesRelations = {
  members: () => ({
    through: memberInitiatives,
    references: members
  }),
  category: (initiative) => ({
    categoryId: initiative.category_id,
    reference: categories
  })
};
var memberViewSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  phone_number: z.string(),
  address: z.string().optional(),
  created_at: z.date(),
  total_donations: z.number().optional(),
  total_beneficiaries: z.number().optional(),
  most_recent_role: z.string().optional(),
  initiatives_count: z.number().optional()
});
var initiativeViewSchema = z.object({
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
  total_beneficiaries_amount: z.number().optional()
});
var memberInitiativeViewSchema = z.object({
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
  category_name: z.string().optional()
});
var reportFiltersSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  initiativeId: z.number().optional(),
  categoryId: z.number().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  role: z.string().optional(),
  memberId: z.number().optional(),
  status: z.string().optional()
});

// server/db.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
var connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}
var client = postgres(connectionString);
var db = drizzle(client, { schema: schema_exports });

// server/storage.ts
import { eq, sql, desc } from "drizzle-orm";
var DatabaseStorage = class {
  // Members
  async getMembers() {
    const result = await db.execute(sql`
      SELECT 
        m.id, 
        m.first_name, 
        m.last_name, 
        m.phone_number, 
        m.address, 
        m.created_at,
        COALESCE(
          (SELECT SUM(mi.amount) 
           FROM member_initiatives mi 
           WHERE mi.member_id = m.id AND mi.role = 'donor'), 
          0
        ) as total_donations,
        COALESCE(
          (SELECT SUM(mi.amount) 
           FROM member_initiatives mi 
           WHERE mi.member_id = m.id AND mi.role = 'beneficiary'), 
          0
        ) as total_beneficiaries,
        (SELECT mi.role 
         FROM member_initiatives mi 
         WHERE mi.member_id = m.id 
         ORDER BY mi.participation_date DESC 
         LIMIT 1) as most_recent_role,
        (SELECT COUNT(DISTINCT mi.initiative_id) 
         FROM member_initiatives mi 
         WHERE mi.member_id = m.id) as initiatives_count
      FROM members m
    `);
    return result.map((row) => ({
      ...row,
      created_at: new Date(row.created_at),
      total_donations: parseFloat(row.total_donations || "0"),
      total_beneficiaries: parseFloat(row.total_beneficiaries || "0"),
      initiatives_count: parseInt(row.initiatives_count || "0")
    }));
  }
  async getMember(id) {
    const result = await db.execute(sql`
      SELECT 
        m.id, 
        m.first_name, 
        m.last_name, 
        m.phone_number, 
        m.address, 
        m.created_at,
        COALESCE(
          (SELECT SUM(mi.amount) 
           FROM member_initiatives mi 
           WHERE mi.member_id = m.id AND mi.role = 'donor'), 
          0
        ) as total_donations,
        COALESCE(
          (SELECT SUM(mi.amount) 
           FROM member_initiatives mi 
           WHERE mi.member_id = m.id AND mi.role = 'beneficiary'), 
          0
        ) as total_beneficiaries,
        (SELECT mi.role 
         FROM member_initiatives mi 
         WHERE mi.member_id = m.id 
         ORDER BY mi.participation_date DESC 
         LIMIT 1) as most_recent_role,
        (SELECT COUNT(DISTINCT mi.initiative_id) 
         FROM member_initiatives mi 
         WHERE mi.member_id = m.id) as initiatives_count
      FROM members m
      WHERE m.id = ${id}
    `);
    if (result.length === 0) return void 0;
    return {
      ...result[0],
      created_at: new Date(result[0].created_at),
      total_donations: parseFloat(result[0].total_donations || "0"),
      total_beneficiaries: parseFloat(result[0].total_beneficiaries || "0"),
      initiatives_count: parseInt(result[0].initiatives_count || "0")
    };
  }
  async getMemberByPhone(phoneNumber) {
    const [member] = await db.select().from(members).where(eq(members.phone_number, phoneNumber));
    return member;
  }
  async createMember(member) {
    const [newMember] = await db.insert(members).values(member).returning();
    return newMember;
  }
  async updateMember(id, memberData) {
    const [updatedMember] = await db.update(members).set(memberData).where(eq(members.id, id)).returning();
    return updatedMember;
  }
  // Categories
  async getCategories() {
    return db.select().from(categories);
  }
  async getCategory(id) {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }
  async getCategoryByName(name) {
    const [category] = await db.select().from(categories).where(eq(categories.name, name));
    return category;
  }
  async createCategory(category) {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }
  // Initiatives
  async getInitiatives() {
    const result = await db.execute(sql`
      SELECT 
        i.id, 
        i.title, 
        i.category_id, 
        c.name as category_name,
        i.description, 
        i.status, 
        i.starting_date, 
        i.ending_date, 
        i.donations_goal, 
        i.created_at,
        (SELECT COUNT(*) 
         FROM member_initiatives mi 
         WHERE mi.initiative_id = i.id AND mi.role = 'donor') as total_donors,
        COALESCE(
          (SELECT SUM(mi.amount) 
           FROM member_initiatives mi 
           WHERE mi.initiative_id = i.id AND mi.role = 'donor'), 
          0
        ) as total_donations,
        (SELECT COUNT(*) 
         FROM member_initiatives mi 
         WHERE mi.initiative_id = i.id AND mi.role = 'beneficiary') as total_beneficiaries,
        COALESCE(
          (SELECT SUM(mi.amount) 
           FROM member_initiatives mi 
           WHERE mi.initiative_id = i.id AND mi.role = 'beneficiary'), 
          0
        ) as total_beneficiaries_amount
      FROM initiatives i
      JOIN categories c ON i.category_id = c.id
    `);
    return result.map((row) => ({
      ...row,
      starting_date: new Date(row.starting_date),
      ending_date: new Date(row.ending_date),
      created_at: new Date(row.created_at),
      donations_goal: parseFloat(row.donations_goal),
      total_donors: parseInt(row.total_donors || "0"),
      total_donations: parseFloat(row.total_donations || "0"),
      total_beneficiaries: parseInt(row.total_beneficiaries || "0"),
      total_beneficiaries_amount: parseFloat(row.total_beneficiaries_amount || "0")
    }));
  }
  async getInitiative(id) {
    const result = await db.execute(sql`
      SELECT 
        i.id, 
        i.title, 
        i.category_id, 
        c.name as category_name,
        i.description, 
        i.status, 
        i.starting_date, 
        i.ending_date, 
        i.donations_goal, 
        i.created_at,
        (SELECT COUNT(*) 
         FROM member_initiatives mi 
         WHERE mi.initiative_id = i.id AND mi.role = 'donor') as total_donors,
        COALESCE(
          (SELECT SUM(mi.amount) 
           FROM member_initiatives mi 
           WHERE mi.initiative_id = i.id AND mi.role = 'donor'), 
          0
        ) as total_donations,
        (SELECT COUNT(*) 
         FROM member_initiatives mi 
         WHERE mi.initiative_id = i.id AND mi.role = 'beneficiary') as total_beneficiaries,
        COALESCE(
          (SELECT SUM(mi.amount) 
           FROM member_initiatives mi 
           WHERE mi.initiative_id = i.id AND mi.role = 'beneficiary'), 
          0
        ) as total_beneficiaries_amount
      FROM initiatives i
      JOIN categories c ON i.category_id = c.id
      WHERE i.id = ${id}
    `);
    if (result.length === 0) return void 0;
    return {
      ...result[0],
      starting_date: new Date(result[0].starting_date),
      ending_date: new Date(result[0].ending_date),
      created_at: new Date(result[0].created_at),
      donations_goal: parseFloat(result[0].donations_goal),
      total_donors: parseInt(result[0].total_donors || "0"),
      total_donations: parseFloat(result[0].total_donations || "0"),
      total_beneficiaries: parseInt(result[0].total_beneficiaries || "0"),
      total_beneficiaries_amount: parseFloat(result[0].total_beneficiaries_amount || "0")
    };
  }
  async createInitiative(initiativeData) {
    console.log("Creating initiative with data:", JSON.stringify(initiativeData, null, 2));
    const startDate = new Date(initiativeData.starting_date);
    const endDate = new Date(initiativeData.ending_date);
    const donationsGoal = typeof initiativeData.donations_goal === "string" ? parseFloat(initiativeData.donations_goal) : initiativeData.donations_goal;
    const now = /* @__PURE__ */ new Date();
    let status = "upcoming";
    if (now >= startDate && now <= endDate) {
      status = "active";
    } else if (now > endDate) {
      status = "ended";
    }
    const dbInitiative = {
      title: initiativeData.title,
      category_id: initiativeData.category_id,
      description: initiativeData.description,
      starting_date: startDate,
      ending_date: endDate,
      donations_goal: donationsGoal,
      status
    };
    try {
      const [newInitiative] = await db.insert(initiatives).values(dbInitiative).returning();
      console.log("Successfully created initiative:", newInitiative.id);
      return newInitiative;
    } catch (error) {
      console.error("Error creating initiative:", error);
      throw error;
    }
  }
  async updateInitiative(id, initiativeData) {
    console.log("Updating initiative with data:", JSON.stringify(initiativeData, null, 2));
    const [currentInitiative] = await db.select().from(initiatives).where(eq(initiatives.id, id));
    if (!currentInitiative) {
      return void 0;
    }
    const updateData = {};
    if (initiativeData.title !== void 0) {
      updateData.title = initiativeData.title;
    }
    if (initiativeData.category_id !== void 0) {
      updateData.category_id = initiativeData.category_id;
    }
    if (initiativeData.description !== void 0) {
      updateData.description = initiativeData.description;
    }
    if (initiativeData.donations_goal !== void 0) {
      updateData.donations_goal = typeof initiativeData.donations_goal === "string" ? parseFloat(initiativeData.donations_goal) : initiativeData.donations_goal;
    }
    const now = /* @__PURE__ */ new Date();
    let startDate = new Date(currentInitiative.starting_date);
    let endDate = new Date(currentInitiative.ending_date);
    if (initiativeData.starting_date) {
      startDate = new Date(initiativeData.starting_date);
      updateData.starting_date = startDate;
    }
    if (initiativeData.ending_date) {
      endDate = new Date(initiativeData.ending_date);
      updateData.ending_date = endDate;
    }
    if (initiativeData.starting_date || initiativeData.ending_date) {
      let status = "upcoming";
      if (now >= startDate && now <= endDate) {
        status = "active";
      } else if (now > endDate) {
        status = "ended";
      }
      updateData.status = status;
    }
    try {
      const [updatedInitiative] = await db.update(initiatives).set(updateData).where(eq(initiatives.id, id)).returning();
      console.log("Successfully updated initiative:", updatedInitiative.id);
      return updatedInitiative;
    } catch (error) {
      console.error("Error updating initiative:", error);
      throw error;
    }
  }
  async updateInitiativeStatus(id, status) {
    const [updatedInitiative] = await db.update(initiatives).set({ status }).where(eq(initiatives.id, id)).returning();
    return updatedInitiative;
  }
  // Member Initiatives
  async getMemberInitiatives(initiativeId) {
    const result = await db.execute(sql`
      SELECT 
        mi.id, 
        mi.member_id, 
        mi.initiative_id, 
        m.first_name, 
        m.last_name, 
        m.phone_number, 
        m.address, 
        mi.role, 
        mi.amount, 
        mi.participation_date
      FROM member_initiatives mi
      JOIN members m ON mi.member_id = m.id
      WHERE mi.initiative_id = ${initiativeId}
    `);
    return result.map((row) => ({
      ...row,
      participation_date: new Date(row.participation_date),
      amount: parseFloat(row.amount)
    }));
  }
  async getMemberInitiativesByMemberId(memberId) {
    const result = await db.execute(sql`
      SELECT 
        mi.id, 
        mi.member_id, 
        mi.initiative_id, 
        m.first_name, 
        m.last_name, 
        m.phone_number, 
        m.address, 
        mi.role, 
        mi.amount, 
        mi.participation_date,
        i.title as initiative_title,
        c.name as category_name
      FROM member_initiatives mi
      JOIN members m ON mi.member_id = m.id
      JOIN initiatives i ON mi.initiative_id = i.id
      JOIN categories c ON i.category_id = c.id
      WHERE mi.member_id = ${memberId}
    `);
    return result.map((row) => ({
      ...row,
      participation_date: new Date(row.participation_date),
      amount: parseFloat(row.amount)
    }));
  }
  async connectMemberToInitiative(memberInitiativeData) {
    console.log("Connecting member to initiative with data:", JSON.stringify(memberInitiativeData, null, 2));
    const amountStr = typeof memberInitiativeData.amount === "number" ? memberInitiativeData.amount.toString() : memberInitiativeData.amount;
    const dbMemberInitiative = {
      member_id: memberInitiativeData.member_id,
      initiative_id: memberInitiativeData.initiative_id,
      role: memberInitiativeData.role,
      amount: amountStr
      // Using string representation for decimal
      // Intentionally omitting participation_date to use database default
    };
    try {
      console.log("Inserting member-initiative with prepared data:", JSON.stringify(dbMemberInitiative, null, 2));
      const [newMemberInitiative] = await db.insert(memberInitiatives).values(dbMemberInitiative).returning();
      console.log("Successfully connected member to initiative:", newMemberInitiative.id);
      return newMemberInitiative;
    } catch (error) {
      console.error("Error connecting member to initiative:", error);
      throw error;
    }
  }
  async updateMemberInitiative(id, memberInitiativeData) {
    console.log("Updating member initiative with data:", JSON.stringify(memberInitiativeData, null, 2));
    const updateData = {};
    if (memberInitiativeData.member_id !== void 0) {
      updateData.member_id = memberInitiativeData.member_id;
    }
    if (memberInitiativeData.initiative_id !== void 0) {
      updateData.initiative_id = memberInitiativeData.initiative_id;
    }
    if (memberInitiativeData.role !== void 0) {
      updateData.role = memberInitiativeData.role;
    }
    if (memberInitiativeData.amount !== void 0) {
      updateData.amount = typeof memberInitiativeData.amount === "number" ? memberInitiativeData.amount.toString() : memberInitiativeData.amount;
    }
    try {
      const [updatedMemberInitiative] = await db.update(memberInitiatives).set(updateData).where(eq(memberInitiatives.id, id)).returning();
      console.log("Successfully updated member initiative:", updatedMemberInitiative.id);
      return updatedMemberInitiative;
    } catch (error) {
      console.error("Error updating member initiative:", error);
      throw error;
    }
  }
  async deleteMemberInitiative(id) {
    const result = await db.delete(memberInitiatives).where(eq(memberInitiatives.id, id)).returning({ id: memberInitiatives.id });
    return result.length > 0;
  }
  // Vault
  async getVaultBalance() {
    const [balanceRecord] = await db.select().from(vaultBalance);
    if (!balanceRecord) {
      const [newBalance] = await db.insert(vaultBalance).values({ balance: "0" }).returning();
      return parseFloat(newBalance.balance.toString());
    }
    return parseFloat(balanceRecord.balance.toString());
  }
  async getVaultTransactions() {
    return db.select().from(vaultTransactions).orderBy(desc(vaultTransactions.transaction_date));
  }
  async createVaultTransaction(transaction) {
    const [newTransaction] = await db.insert(vaultTransactions).values(transaction).returning();
    const amount = transaction.type === "deposit" || transaction.type === "surplus" ? parseFloat(transaction.amount.toString()) : -parseFloat(transaction.amount.toString());
    await this.updateVaultBalance(amount);
    if (transaction.type === "donation" && transaction.initiative_id) {
      try {
        let vaultMemberId = 0;
        const vaultMember = await db.select().from(members).where(eq(members.first_name, "Vault")).limit(1);
        if (vaultMember.length === 0) {
          const [newVaultMember] = await db.insert(members).values({
            first_name: "Vault",
            last_name: "Donation",
            phone_number: "vault-system",
            created_at: /* @__PURE__ */ new Date()
          }).returning();
          vaultMemberId = newVaultMember.id;
          console.log(`Created Vault member with ID ${vaultMemberId}`);
        } else {
          vaultMemberId = vaultMember[0].id;
        }
        await db.insert(memberInitiatives).values({
          member_id: vaultMemberId,
          initiative_id: transaction.initiative_id,
          role: "donor",
          amount: transaction.amount,
          participation_date: /* @__PURE__ */ new Date()
        });
        console.log(`Created member initiative record for vault donation to initiative ${transaction.initiative_id}`);
      } catch (error) {
        console.error("Error creating member initiative for vault donation:", error);
      }
    }
    return newTransaction;
  }
  async updateVaultBalance(amount) {
    const [balanceRecord] = await db.select().from(vaultBalance);
    if (!balanceRecord) {
      const [newBalance2] = await db.insert(vaultBalance).values({ balance: amount.toString() }).returning();
      return parseFloat(newBalance2.balance.toString());
    }
    const currentBalance = parseFloat(balanceRecord.balance.toString());
    const newBalance = currentBalance + amount;
    const [updatedBalance] = await db.update(vaultBalance).set({ balance: newBalance.toString() }).where(eq(vaultBalance.id, balanceRecord.id)).returning();
    return parseFloat(updatedBalance.balance.toString());
  }
  // Reports
  async getDonationsReport(filters) {
    const conditions = [];
    let baseQuery = sql`
      SELECT 
        mi.id as donation_id,
        mi.member_id,
        m.first_name,
        m.last_name,
        m.phone_number,
        mi.initiative_id,
        i.title as initiative_title,
        c.name as category_name,
        mi.amount,
        mi.participation_date
      FROM member_initiatives mi
      JOIN members m ON mi.member_id = m.id
      JOIN initiatives i ON mi.initiative_id = i.id
      JOIN categories c ON i.category_id = c.id
      WHERE mi.role = 'donor'
    `;
    if (filters.startDate) {
      conditions.push(sql`mi.participation_date >= ${new Date(filters.startDate)}`);
    }
    if (filters.endDate) {
      conditions.push(sql`mi.participation_date <= ${new Date(filters.endDate)}`);
    }
    if (filters.initiativeId) {
      conditions.push(sql`mi.initiative_id = ${filters.initiativeId}`);
    }
    if (filters.categoryId) {
      conditions.push(sql`i.category_id = ${filters.categoryId}`);
    }
    if (filters.memberId) {
      conditions.push(sql`mi.member_id = ${filters.memberId}`);
    }
    if (filters.minAmount !== void 0) {
      conditions.push(sql`CAST(mi.amount AS DECIMAL) >= ${filters.minAmount}`);
    }
    if (filters.maxAmount !== void 0) {
      conditions.push(sql`CAST(mi.amount AS DECIMAL) <= ${filters.maxAmount}`);
    }
    let finalQuery = baseQuery;
    if (conditions.length > 0) {
      conditions.forEach((condition) => {
        finalQuery = sql`${finalQuery} AND ${condition}`;
      });
    }
    finalQuery = sql`${finalQuery} ORDER BY mi.participation_date DESC`;
    const result = await db.execute(finalQuery);
    return result.map((row) => ({
      ...row,
      participation_date: row.participation_date ? new Date(row.participation_date) : /* @__PURE__ */ new Date(),
      amount: row.amount ? parseFloat(row.amount) : 0
    }));
  }
  async getBeneficiariesReport(filters) {
    const conditions = [];
    let baseQuery = sql`
      SELECT 
        mi.id as beneficiary_record_id,
        mi.member_id,
        m.first_name,
        m.last_name,
        m.phone_number,
        m.address,
        mi.initiative_id,
        i.title as initiative_title,
        c.name as category_name,
        mi.amount,
        mi.participation_date
      FROM member_initiatives mi
      JOIN members m ON mi.member_id = m.id
      JOIN initiatives i ON mi.initiative_id = i.id
      JOIN categories c ON i.category_id = c.id
      WHERE mi.role = 'beneficiary'
    `;
    if (filters.startDate) {
      conditions.push(sql`mi.participation_date >= ${new Date(filters.startDate)}`);
    }
    if (filters.endDate) {
      conditions.push(sql`mi.participation_date <= ${new Date(filters.endDate)}`);
    }
    if (filters.initiativeId) {
      conditions.push(sql`mi.initiative_id = ${filters.initiativeId}`);
    }
    if (filters.categoryId) {
      conditions.push(sql`i.category_id = ${filters.categoryId}`);
    }
    if (filters.memberId) {
      conditions.push(sql`mi.member_id = ${filters.memberId}`);
    }
    if (filters.minAmount !== void 0) {
      conditions.push(sql`CAST(mi.amount AS DECIMAL) >= ${filters.minAmount}`);
    }
    if (filters.maxAmount !== void 0) {
      conditions.push(sql`CAST(mi.amount AS DECIMAL) <= ${filters.maxAmount}`);
    }
    let finalQuery = baseQuery;
    if (conditions.length > 0) {
      conditions.forEach((condition) => {
        finalQuery = sql`${finalQuery} AND ${condition}`;
      });
    }
    finalQuery = sql`${finalQuery} ORDER BY mi.participation_date DESC`;
    const result = await db.execute(finalQuery);
    return result.map((row) => ({
      ...row,
      participation_date: row.participation_date ? new Date(row.participation_date) : /* @__PURE__ */ new Date(),
      amount: row.amount ? parseFloat(row.amount) : 0
    }));
  }
  async getInitiativesReport(filters) {
    const conditions = [];
    let baseQuery = sql`
      SELECT 
        i.id,
        i.title,
        i.description,
        i.status,
        i.starting_date,
        i.ending_date,
        i.donations_goal,
        i.created_at,
        c.id as category_id,
        c.name as category_name,
        (SELECT COUNT(*) FROM member_initiatives mi WHERE mi.initiative_id = i.id AND mi.role = 'donor') as total_donors,
        COALESCE((SELECT SUM(CAST(mi.amount AS DECIMAL)) FROM member_initiatives mi WHERE mi.initiative_id = i.id AND mi.role = 'donor'), 0) as total_donations,
        (SELECT COUNT(*) FROM member_initiatives mi WHERE mi.initiative_id = i.id AND mi.role = 'beneficiary') as total_beneficiaries,
        COALESCE((SELECT SUM(CAST(mi.amount AS DECIMAL)) FROM member_initiatives mi WHERE mi.initiative_id = i.id AND mi.role = 'beneficiary'), 0) as total_beneficiaries_amount
      FROM initiatives i
      JOIN categories c ON i.category_id = c.id
    `;
    if (filters.startDate) {
      conditions.push(sql`i.starting_date >= ${new Date(filters.startDate)}`);
    }
    if (filters.endDate) {
      conditions.push(sql`i.ending_date <= ${new Date(filters.endDate)}`);
    }
    if (filters.initiativeId) {
      conditions.push(sql`i.id = ${filters.initiativeId}`);
    }
    if (filters.categoryId) {
      conditions.push(sql`i.category_id = ${filters.categoryId}`);
    }
    if (filters.status) {
      conditions.push(sql`i.status = ${filters.status}`);
    }
    let finalQuery = baseQuery;
    if (conditions.length > 0) {
      let whereClause = sql`WHERE ${conditions[0]}`;
      for (let i = 1; i < conditions.length; i++) {
        whereClause = sql`${whereClause} AND ${conditions[i]}`;
      }
      finalQuery = sql`${baseQuery} ${whereClause}`;
    }
    finalQuery = sql`${finalQuery} ORDER BY i.created_at DESC`;
    const result = await db.execute(finalQuery);
    return result.map((row) => ({
      ...row,
      starting_date: row.starting_date ? new Date(row.starting_date) : /* @__PURE__ */ new Date(),
      ending_date: row.ending_date ? new Date(row.ending_date) : /* @__PURE__ */ new Date(),
      created_at: row.created_at ? new Date(row.created_at) : /* @__PURE__ */ new Date(),
      donations_goal: row.donations_goal ? parseFloat(row.donations_goal) : 0,
      total_donors: row.total_donors ? parseInt(row.total_donors) : 0,
      total_donations: row.total_donations ? parseFloat(row.total_donations) : 0,
      total_beneficiaries: row.total_beneficiaries ? parseInt(row.total_beneficiaries) : 0,
      total_beneficiaries_amount: row.total_beneficiaries_amount ? parseFloat(row.total_beneficiaries_amount) : 0
    }));
  }
  async getMembersActivityReport(filters) {
    const conditions = [];
    let baseQuery = sql`
      SELECT 
        m.id,
        m.first_name,
        m.last_name,
        m.phone_number,
        m.address,
        m.created_at,
        COALESCE((SELECT SUM(CAST(mi.amount AS DECIMAL)) FROM member_initiatives mi WHERE mi.member_id = m.id AND mi.role = 'donor'), 0) as total_donations,
        COALESCE((SELECT SUM(CAST(mi.amount AS DECIMAL)) FROM member_initiatives mi WHERE mi.member_id = m.id AND mi.role = 'beneficiary'), 0) as total_benefits,
        (SELECT COUNT(DISTINCT mi.initiative_id) FROM member_initiatives mi WHERE mi.member_id = m.id) as total_initiatives,
        (SELECT COUNT(*) FROM member_initiatives mi WHERE mi.member_id = m.id AND mi.role = 'donor') as donation_count,
        (SELECT COUNT(*) FROM member_initiatives mi WHERE mi.member_id = m.id AND mi.role = 'beneficiary') as benefit_count
      FROM members m
    `;
    if (filters.memberId) {
      conditions.push(sql`m.id = ${filters.memberId}`);
    }
    if (filters.role) {
      if (filters.role === "donor") {
        conditions.push(sql`EXISTS (SELECT 1 FROM member_initiatives mi WHERE mi.member_id = m.id AND mi.role = 'donor')`);
      } else if (filters.role === "beneficiary") {
        conditions.push(sql`EXISTS (SELECT 1 FROM member_initiatives mi WHERE mi.member_id = m.id AND mi.role = 'beneficiary')`);
      }
    }
    if (filters.startDate) {
      conditions.push(sql`m.created_at >= ${new Date(filters.startDate)}`);
    }
    if (filters.endDate) {
      conditions.push(sql`m.created_at <= ${new Date(filters.endDate)}`);
    }
    let finalQuery = baseQuery;
    if (conditions.length > 0) {
      let whereClause = sql`WHERE ${conditions[0]}`;
      for (let i = 1; i < conditions.length; i++) {
        whereClause = sql`${whereClause} AND ${conditions[i]}`;
      }
      finalQuery = sql`${baseQuery} ${whereClause}`;
    }
    finalQuery = sql`${finalQuery} ORDER BY m.created_at DESC`;
    const result = await db.execute(finalQuery);
    return result.map((row) => ({
      ...row,
      created_at: row.created_at ? new Date(row.created_at) : /* @__PURE__ */ new Date(),
      total_donations: row.total_donations ? parseFloat(row.total_donations) : 0,
      total_benefits: row.total_benefits ? parseFloat(row.total_benefits) : 0,
      total_initiatives: row.total_initiatives ? parseInt(row.total_initiatives) : 0,
      donation_count: row.donation_count ? parseInt(row.donation_count) : 0,
      benefit_count: row.benefit_count ? parseInt(row.benefit_count) : 0
    }));
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import { ZodError } from "zod";
async function registerRoutes(app2) {
  app2.use((req, res, next) => {
    res.handleError = (error) => {
      console.error(error);
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors
        });
      }
      return res.status(500).json({ message: error.message || "An unexpected error occurred" });
    };
    next();
  });
  app2.get("/api/members", async (req, res) => {
    try {
      const members2 = await storage.getMembers();
      res.json(members2);
    } catch (error) {
      res.handleError(error);
    }
  });
  app2.get("/api/members/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      const member = await storage.getMember(id);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      res.json(member);
    } catch (error) {
      res.handleError(error);
    }
  });
  app2.post("/api/members", async (req, res) => {
    try {
      const memberData = insertMemberSchema.parse(req.body);
      const existingMember = await storage.getMemberByPhone(memberData.phone_number);
      if (existingMember) {
        return res.status(400).json({ message: "A member with this phone number already exists" });
      }
      const newMember = await storage.createMember(memberData);
      res.status(201).json(newMember);
    } catch (error) {
      res.handleError(error);
    }
  });
  app2.put("/api/members/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      const memberData = insertMemberSchema.partial().parse(req.body);
      if (memberData.phone_number) {
        const existingMember = await storage.getMemberByPhone(memberData.phone_number);
        if (existingMember && existingMember.id !== id) {
          return res.status(400).json({ message: "A member with this phone number already exists" });
        }
      }
      const updatedMember = await storage.updateMember(id, memberData);
      if (!updatedMember) {
        return res.status(404).json({ message: "Member not found" });
      }
      res.json(updatedMember);
    } catch (error) {
      res.handleError(error);
    }
  });
  app2.get("/api/members/:id/initiatives", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      const memberInitiatives2 = await storage.getMemberInitiativesByMemberId(id);
      res.json(memberInitiatives2);
    } catch (error) {
      res.handleError(error);
    }
  });
  app2.get("/api/categories", async (req, res) => {
    try {
      const categories2 = await storage.getCategories();
      res.json(categories2);
    } catch (error) {
      res.handleError(error);
    }
  });
  app2.post("/api/categories", async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const existingCategory = await storage.getCategoryByName(categoryData.name);
      if (existingCategory) {
        return res.status(400).json({ message: "A category with this name already exists" });
      }
      const newCategory = await storage.createCategory(categoryData);
      res.status(201).json(newCategory);
    } catch (error) {
      res.handleError(error);
    }
  });
  app2.get("/api/initiatives", async (req, res) => {
    try {
      const initiatives2 = await storage.getInitiatives();
      res.json(initiatives2);
    } catch (error) {
      res.handleError(error);
    }
  });
  app2.get("/api/initiatives/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      const initiative = await storage.getInitiative(id);
      if (!initiative) {
        return res.status(404).json({ message: "Initiative not found" });
      }
      res.json(initiative);
    } catch (error) {
      res.handleError(error);
    }
  });
  app2.post("/api/initiatives", async (req, res) => {
    try {
      const parsedData = insertInitiativeSchema.parse(req.body);
      const initiativeData = {
        ...parsedData,
        // Convert string dates to Date objects
        starting_date: new Date(parsedData.starting_date),
        ending_date: new Date(parsedData.ending_date),
        // Ensure donations_goal is a number
        donations_goal: typeof parsedData.donations_goal === "string" ? parseFloat(parsedData.donations_goal) : parsedData.donations_goal
      };
      const category = await storage.getCategory(initiativeData.category_id);
      if (!category) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      if (initiativeData.ending_date <= initiativeData.starting_date) {
        return res.status(400).json({ message: "End date must be after start date" });
      }
      const newInitiative = await storage.createInitiative(initiativeData);
      res.status(201).json(newInitiative);
    } catch (error) {
      console.error("Initiative creation error:", error);
      res.handleError(error);
    }
  });
  app2.put("/api/initiatives/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      const parsedData = insertInitiativeSchema.partial().parse(req.body);
      const initiativeData = { ...parsedData };
      if (parsedData.starting_date) {
        initiativeData.starting_date = new Date(parsedData.starting_date);
      }
      if (parsedData.ending_date) {
        initiativeData.ending_date = new Date(parsedData.ending_date);
      }
      if (parsedData.donations_goal && typeof parsedData.donations_goal === "string") {
        initiativeData.donations_goal = parseFloat(parsedData.donations_goal);
      }
      if (initiativeData.category_id) {
        const category = await storage.getCategory(initiativeData.category_id);
        if (!category) {
          return res.status(400).json({ message: "Invalid category ID" });
        }
      }
      if (initiativeData.starting_date || initiativeData.ending_date) {
        const initiative = await storage.getInitiative(id);
        if (!initiative) {
          return res.status(404).json({ message: "Initiative not found" });
        }
        const startDate = initiativeData.starting_date ? initiativeData.starting_date : initiative.starting_date;
        const endDate = initiativeData.ending_date ? initiativeData.ending_date : initiative.ending_date;
        if (endDate <= startDate) {
          return res.status(400).json({ message: "End date must be after start date" });
        }
      }
      const updatedInitiative = await storage.updateInitiative(id, initiativeData);
      if (!updatedInitiative) {
        return res.status(404).json({ message: "Initiative not found" });
      }
      res.json(updatedInitiative);
    } catch (error) {
      console.error("Initiative update error:", error);
      res.handleError(error);
    }
  });
  app2.put("/api/initiatives/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      const { status } = req.body;
      if (!status || !["upcoming", "active", "ended"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      const updatedInitiative = await storage.updateInitiativeStatus(id, status);
      if (!updatedInitiative) {
        return res.status(404).json({ message: "Initiative not found" });
      }
      res.json(updatedInitiative);
    } catch (error) {
      res.handleError(error);
    }
  });
  app2.get("/api/initiatives/:id/members", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      const memberInitiatives2 = await storage.getMemberInitiatives(id);
      res.json(memberInitiatives2);
    } catch (error) {
      res.handleError(error);
    }
  });
  app2.post("/api/initiatives/:id/members", async (req, res) => {
    try {
      console.log("Connecting member to initiative - received data:", JSON.stringify(req.body, null, 2));
      const initiativeId = parseInt(req.params.id);
      if (isNaN(initiativeId)) {
        return res.status(400).json({ message: "Invalid initiative ID format" });
      }
      const initiative = await storage.getInitiative(initiativeId);
      if (!initiative) {
        return res.status(404).json({ message: "Initiative not found" });
      }
      if (initiative.status !== "active") {
        return res.status(400).json({ message: `Cannot add members to an initiative with status: ${initiative.status}` });
      }
      try {
        const memberInitiativeData = insertMemberInitiativeSchema.parse({
          ...req.body,
          initiative_id: initiativeId
        });
        const member = await storage.getMember(memberInitiativeData.member_id);
        if (!member) {
          return res.status(400).json({ message: "Invalid member ID" });
        }
        console.log("Validated member initiative data:", JSON.stringify(memberInitiativeData, null, 2));
        const newMemberInitiative = await storage.connectMemberToInitiative(memberInitiativeData);
        res.status(201).json(newMemberInitiative);
      } catch (parseError) {
        console.error("Schema validation error:", parseError);
        return res.status(400).json({
          message: "Invalid member initiative data",
          details: parseError instanceof Error ? parseError.message : String(parseError)
        });
      }
    } catch (error) {
      console.error("Error connecting member to initiative:", error);
      res.handleError(error);
    }
  });
  app2.put("/api/member-initiatives/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      const memberInitiativeData = insertMemberInitiativeSchema.partial().parse(req.body);
      const updatedMemberInitiative = await storage.updateMemberInitiative(id, memberInitiativeData);
      if (!updatedMemberInitiative) {
        return res.status(404).json({ message: "Member initiative not found" });
      }
      res.json(updatedMemberInitiative);
    } catch (error) {
      res.handleError(error);
    }
  });
  app2.delete("/api/member-initiatives/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      const deleted = await storage.deleteMemberInitiative(id);
      if (!deleted) {
        return res.status(404).json({ message: "Member initiative not found" });
      }
      res.status(204).end();
    } catch (error) {
      res.handleError(error);
    }
  });
  app2.get("/api/vault/balance", async (req, res) => {
    try {
      const balance = await storage.getVaultBalance();
      res.json({ balance });
    } catch (error) {
      res.handleError(error);
    }
  });
  app2.get("/api/vault/transactions", async (req, res) => {
    try {
      const transactions = await storage.getVaultTransactions();
      res.json(transactions);
    } catch (error) {
      res.handleError(error);
    }
  });
  app2.post("/api/vault/transactions", async (req, res) => {
    try {
      const transactionData = insertVaultTransactionSchema.parse(req.body);
      if (transactionData.type === "withdraw" || transactionData.type === "donation") {
        const currentBalance = await storage.getVaultBalance();
        const amount = parseFloat(transactionData.amount.toString());
        if (amount > currentBalance) {
          return res.status(400).json({ message: "Insufficient vault balance" });
        }
      }
      if (transactionData.type === "donation" && transactionData.initiative_id) {
        const initiative = await storage.getInitiative(transactionData.initiative_id);
        if (!initiative) {
          return res.status(400).json({ message: "Initiative not found" });
        }
        if (initiative.status !== "active") {
          return res.status(400).json({ message: `Cannot donate to an initiative with status: ${initiative.status}` });
        }
      }
      const newTransaction = await storage.createVaultTransaction(transactionData);
      res.status(201).json(newTransaction);
    } catch (error) {
      res.handleError(error);
    }
  });
  app2.get("/api/reports/donations", async (req, res) => {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        initiativeId: req.query.initiativeId ? parseInt(req.query.initiativeId) : void 0,
        categoryId: req.query.categoryId ? parseInt(req.query.categoryId) : void 0,
        minAmount: req.query.minAmount ? parseFloat(req.query.minAmount) : void 0,
        maxAmount: req.query.maxAmount ? parseFloat(req.query.maxAmount) : void 0,
        memberId: req.query.memberId ? parseInt(req.query.memberId) : void 0
      };
      const report = await storage.getDonationsReport(filters);
      res.json(report);
    } catch (error) {
      res.handleError(error);
    }
  });
  app2.get("/api/reports/beneficiaries", async (req, res) => {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        initiativeId: req.query.initiativeId ? parseInt(req.query.initiativeId) : void 0,
        categoryId: req.query.categoryId ? parseInt(req.query.categoryId) : void 0,
        minAmount: req.query.minAmount ? parseFloat(req.query.minAmount) : void 0,
        maxAmount: req.query.maxAmount ? parseFloat(req.query.maxAmount) : void 0,
        memberId: req.query.memberId ? parseInt(req.query.memberId) : void 0
      };
      const report = await storage.getBeneficiariesReport(filters);
      res.json(report);
    } catch (error) {
      res.handleError(error);
    }
  });
  app2.get("/api/reports/initiatives", async (req, res) => {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        initiativeId: req.query.initiativeId ? parseInt(req.query.initiativeId) : void 0,
        categoryId: req.query.categoryId ? parseInt(req.query.categoryId) : void 0,
        status: req.query.status
      };
      const report = await storage.getInitiativesReport(filters);
      res.json(report);
    } catch (error) {
      res.handleError(error);
    }
  });
  app2.post("/api/reports/donations", async (req, res) => {
    try {
      const parseResult = reportFiltersSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          message: "Invalid filter data",
          errors: parseResult.error.errors
        });
      }
      const filters = parseResult.data;
      const report = await storage.getDonationsReport(filters);
      res.json(report);
    } catch (error) {
      res.handleError(error);
    }
  });
  app2.post("/api/reports/beneficiaries", async (req, res) => {
    try {
      const parseResult = reportFiltersSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          message: "Invalid filter data",
          errors: parseResult.error.errors
        });
      }
      const filters = parseResult.data;
      const report = await storage.getBeneficiariesReport(filters);
      res.json(report);
    } catch (error) {
      res.handleError(error);
    }
  });
  app2.post("/api/reports/initiatives", async (req, res) => {
    try {
      const parseResult = reportFiltersSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          message: "Invalid filter data",
          errors: parseResult.error.errors
        });
      }
      const filters = parseResult.data;
      const report = await storage.getInitiativesReport(filters);
      res.json(report);
    } catch (error) {
      res.handleError(error);
    }
  });
  app2.post("/api/reports/members", async (req, res) => {
    try {
      const parseResult = reportFiltersSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          message: "Invalid filter data",
          errors: parseResult.error.errors
        });
      }
      const filters = parseResult.data;
      const report = await storage.getMembersActivityReport(filters);
      res.json(report);
    } catch (error) {
      res.handleError(error);
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
