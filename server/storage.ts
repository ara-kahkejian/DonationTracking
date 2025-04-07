import { 
  Member, InsertMember, members, 
  Category, InsertCategory, categories,
  Initiative, InsertInitiative, initiatives,
  MemberInitiative, InsertMemberInitiative, memberInitiatives,
  VaultTransaction, InsertVaultTransaction, vaultTransactions,
  VaultBalance, vaultBalance,
  MemberView, InitiativeView, MemberInitiativeView,
  ReportFilters
} from '@shared/schema';
import { db } from './db';
import { eq, sql, and, gte, lte, desc, asc, or, like, SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

export interface IStorage {
  // Members
  getMembers(): Promise<MemberView[]>;
  getMember(id: number): Promise<MemberView | undefined>;
  getMemberByPhone(phoneNumber: string): Promise<Member | undefined>;
  createMember(member: InsertMember): Promise<Member>;
  updateMember(id: number, member: Partial<InsertMember>): Promise<Member | undefined>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  getCategoryByName(name: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Initiatives
  getInitiatives(): Promise<InitiativeView[]>;
  getInitiative(id: number): Promise<InitiativeView | undefined>;
  createInitiative(initiative: InsertInitiative): Promise<Initiative>;
  updateInitiative(id: number, initiative: Partial<InsertInitiative>): Promise<Initiative | undefined>;
  updateInitiativeStatus(id: number, status: string): Promise<Initiative | undefined>;
  
  // Member Initiatives
  getMemberInitiatives(initiativeId: number): Promise<MemberInitiativeView[]>;
  getMemberInitiativesByMemberId(memberId: number): Promise<MemberInitiativeView[]>;
  connectMemberToInitiative(memberInitiative: InsertMemberInitiative): Promise<MemberInitiative>;
  updateMemberInitiative(id: number, memberInitiative: Partial<InsertMemberInitiative>): Promise<MemberInitiative | undefined>;
  deleteMemberInitiative(id: number): Promise<boolean>;
  
  // Vault
  getVaultBalance(): Promise<number>;
  getVaultTransactions(): Promise<VaultTransaction[]>;
  createVaultTransaction(transaction: InsertVaultTransaction): Promise<VaultTransaction>;
  updateVaultBalance(amount: number): Promise<number>;
  
  // Reports
  getDonationsReport(filters: ReportFilters): Promise<any[]>;
  getBeneficiariesReport(filters: ReportFilters): Promise<any[]>;
  getInitiativesReport(filters: ReportFilters): Promise<any[]>;
  getMembersActivityReport(filters: ReportFilters): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // Members
  async getMembers(): Promise<MemberView[]> {
    // Get all members with calculated fields
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
    
    return result.map(row => ({
      ...row,
      created_at: new Date(row.created_at),
      total_donations: parseFloat(row.total_donations || '0'),
      total_beneficiaries: parseFloat(row.total_beneficiaries || '0'),
      initiatives_count: parseInt(row.initiatives_count || '0')
    }));
  }

  async getMember(id: number): Promise<MemberView | undefined> {
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
    
    if (result.length === 0) return undefined;
    
    return {
      ...result[0],
      created_at: new Date(result[0].created_at),
      total_donations: parseFloat(result[0].total_donations || '0'),
      total_beneficiaries: parseFloat(result[0].total_beneficiaries || '0'),
      initiatives_count: parseInt(result[0].initiatives_count || '0')
    };
  }

  async getMemberByPhone(phoneNumber: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.phone_number, phoneNumber));
    return member;
  }

  async createMember(member: InsertMember): Promise<Member> {
    const [newMember] = await db.insert(members).values(member).returning();
    return newMember;
  }

  async updateMember(id: number, memberData: Partial<InsertMember>): Promise<Member | undefined> {
    const [updatedMember] = await db
      .update(members)
      .set(memberData)
      .where(eq(members.id, id))
      .returning();
    return updatedMember;
  }
  
  // Categories
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async getCategoryByName(name: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.name, name));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }
  
  // Initiatives
  async getInitiatives(): Promise<InitiativeView[]> {
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
    
    return result.map(row => ({
      ...row,
      starting_date: new Date(row.starting_date),
      ending_date: new Date(row.ending_date),
      created_at: new Date(row.created_at),
      donations_goal: parseFloat(row.donations_goal),
      total_donors: parseInt(row.total_donors || '0'),
      total_donations: parseFloat(row.total_donations || '0'),
      total_beneficiaries: parseInt(row.total_beneficiaries || '0'),
      total_beneficiaries_amount: parseFloat(row.total_beneficiaries_amount || '0')
    }));
  }

  async getInitiative(id: number): Promise<InitiativeView | undefined> {
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
    
    if (result.length === 0) return undefined;
    
    return {
      ...result[0],
      starting_date: new Date(result[0].starting_date),
      ending_date: new Date(result[0].ending_date),
      created_at: new Date(result[0].created_at),
      donations_goal: parseFloat(result[0].donations_goal),
      total_donors: parseInt(result[0].total_donors || '0'),
      total_donations: parseFloat(result[0].total_donations || '0'),
      total_beneficiaries: parseInt(result[0].total_beneficiaries || '0'),
      total_beneficiaries_amount: parseFloat(result[0].total_beneficiaries_amount || '0')
    };
  }

  async createInitiative(initiativeData: InsertInitiative): Promise<Initiative> {
    console.log("Creating initiative with data:", JSON.stringify(initiativeData, null, 2));
    
    // Create a proper database compatible object with typed values
    const startDate = new Date(initiativeData.starting_date);
    const endDate = new Date(initiativeData.ending_date);
    
    // Ensure donations_goal is a number
    const donationsGoal = typeof initiativeData.donations_goal === 'string' 
      ? parseFloat(initiativeData.donations_goal) 
      : initiativeData.donations_goal;
    
    // Determine status based on dates
    const now = new Date();
    let status = 'upcoming';
    if (now >= startDate && now <= endDate) {
      status = 'active';
    } else if (now > endDate) {
      status = 'ended';
    }
    
    // Clean data for insertion
    const dbInitiative = {
      title: initiativeData.title,
      category_id: initiativeData.category_id,
      description: initiativeData.description,
      starting_date: startDate,
      ending_date: endDate,
      donations_goal: donationsGoal,
      status: status
    };
    
    try {
      const [newInitiative] = await db
        .insert(initiatives)
        .values(dbInitiative)
        .returning();
      
      console.log("Successfully created initiative:", newInitiative.id);
      return newInitiative;
    } catch (error) {
      console.error("Error creating initiative:", error);
      throw error;
    }
  }

  async updateInitiative(id: number, initiativeData: Partial<InsertInitiative>): Promise<Initiative | undefined> {
    console.log("Updating initiative with data:", JSON.stringify(initiativeData, null, 2));
    
    // Get current initiative to merge with updates
    const [currentInitiative] = await db
      .select()
      .from(initiatives)
      .where(eq(initiatives.id, id));
    
    if (!currentInitiative) {
      return undefined;
    }
    
    // Prepare clean update data with proper types
    const updateData: Record<string, any> = {};
    
    // Process title if provided
    if (initiativeData.title !== undefined) {
      updateData.title = initiativeData.title;
    }
    
    // Process category_id if provided
    if (initiativeData.category_id !== undefined) {
      updateData.category_id = initiativeData.category_id;
    }
    
    // Process description if provided
    if (initiativeData.description !== undefined) {
      updateData.description = initiativeData.description;
    }
    
    // Process donations_goal if provided
    if (initiativeData.donations_goal !== undefined) {
      updateData.donations_goal = typeof initiativeData.donations_goal === 'string'
        ? parseFloat(initiativeData.donations_goal)
        : initiativeData.donations_goal;
    }
    
    // Process dates and calculate status
    const now = new Date();
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
    
    // Update status if dates changed
    if (initiativeData.starting_date || initiativeData.ending_date) {
      let status = 'upcoming';
      if (now >= startDate && now <= endDate) {
        status = 'active';
      } else if (now > endDate) {
        status = 'ended';
      }
      updateData.status = status;
    }
    
    try {
      const [updatedInitiative] = await db
        .update(initiatives)
        .set(updateData)
        .where(eq(initiatives.id, id))
        .returning();
      
      console.log("Successfully updated initiative:", updatedInitiative.id);
      return updatedInitiative;
    } catch (error) {
      console.error("Error updating initiative:", error);
      throw error;
    }
  }

  async updateInitiativeStatus(id: number, status: string): Promise<Initiative | undefined> {
    const [updatedInitiative] = await db
      .update(initiatives)
      .set({ status })
      .where(eq(initiatives.id, id))
      .returning();
    
    return updatedInitiative;
  }
  
  // Member Initiatives
  async getMemberInitiatives(initiativeId: number): Promise<MemberInitiativeView[]> {
    // Now that we're using a real "Vault" member in the members table,
    // we can simplify this query back to the original
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
    
    return result.map(row => ({
      ...row,
      participation_date: new Date(row.participation_date),
      amount: parseFloat(row.amount)
    }));
  }

  async getMemberInitiativesByMemberId(memberId: number): Promise<MemberInitiativeView[]> {
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
    
    return result.map(row => ({
      ...row,
      participation_date: new Date(row.participation_date),
      amount: parseFloat(row.amount)
    }));
  }

  async connectMemberToInitiative(memberInitiativeData: InsertMemberInitiative): Promise<MemberInitiative> {
    console.log("Connecting member to initiative with data:", JSON.stringify(memberInitiativeData, null, 2));
    
    // Process amount to ensure it's a string (the DB expects a decimal which is stored as a string)
    const amountStr = typeof memberInitiativeData.amount === 'number'
      ? memberInitiativeData.amount.toString()
      : memberInitiativeData.amount;
    
    // Instead of passing a Date object to the database, we'll let the database handle the default value
    // by omitting the participation_date field entirely when inserting
    // This avoids any date parsing issues
    const dbMemberInitiative = {
      member_id: memberInitiativeData.member_id,
      initiative_id: memberInitiativeData.initiative_id,
      role: memberInitiativeData.role,
      amount: amountStr // Using string representation for decimal
      // Intentionally omitting participation_date to use database default
    };
    
    try {
      console.log("Inserting member-initiative with prepared data:", JSON.stringify(dbMemberInitiative, null, 2));
      
      // Perform the database insert
      const [newMemberInitiative] = await db
        .insert(memberInitiatives)
        .values(dbMemberInitiative)
        .returning();
      
      console.log("Successfully connected member to initiative:", newMemberInitiative.id);
      return newMemberInitiative;
    } catch (error) {
      console.error("Error connecting member to initiative:", error);
      throw error;
    }
  }

  async updateMemberInitiative(id: number, memberInitiativeData: Partial<InsertMemberInitiative>): Promise<MemberInitiative | undefined> {
    console.log("Updating member initiative with data:", JSON.stringify(memberInitiativeData, null, 2));
    
    // Prepare clean update data with proper types
    const updateData: Record<string, any> = {};
    
    // Process fields with type conversion if needed
    if (memberInitiativeData.member_id !== undefined) {
      updateData.member_id = memberInitiativeData.member_id;
    }
    
    if (memberInitiativeData.initiative_id !== undefined) {
      updateData.initiative_id = memberInitiativeData.initiative_id;
    }
    
    if (memberInitiativeData.role !== undefined) {
      updateData.role = memberInitiativeData.role;
    }
    
    if (memberInitiativeData.amount !== undefined) {
      // Ensure the amount is stored as a string for the decimal type
      updateData.amount = typeof memberInitiativeData.amount === 'number'
        ? memberInitiativeData.amount.toString()
        : memberInitiativeData.amount;
    }
    
    // We're going to skip updating participation_date to avoid date-related issues
    // If we need to update it in the future, we can revisit this code
    /* Intentionally skipping participation_date update */
    
    try {
      const [updatedMemberInitiative] = await db
        .update(memberInitiatives)
        .set(updateData)
        .where(eq(memberInitiatives.id, id))
        .returning();
      
      console.log("Successfully updated member initiative:", updatedMemberInitiative.id);
      return updatedMemberInitiative;
    } catch (error) {
      console.error("Error updating member initiative:", error);
      throw error;
    }
  }

  async deleteMemberInitiative(id: number): Promise<boolean> {
    const result = await db
      .delete(memberInitiatives)
      .where(eq(memberInitiatives.id, id))
      .returning({ id: memberInitiatives.id });
    
    return result.length > 0;
  }
  
  // Vault
  async getVaultBalance(): Promise<number> {
    // Get the current balance
    const [balanceRecord] = await db.select().from(vaultBalance);
    
    // If no record exists yet, create one
    if (!balanceRecord) {
      const [newBalance] = await db
        .insert(vaultBalance)
        .values({ balance: "0" })
        .returning();
      
      return parseFloat(newBalance.balance.toString());
    }
    
    return parseFloat(balanceRecord.balance.toString());
  }

  async getVaultTransactions(): Promise<VaultTransaction[]> {
    return db.select().from(vaultTransactions).orderBy(desc(vaultTransactions.transaction_date));
  }

  async createVaultTransaction(transaction: InsertVaultTransaction): Promise<VaultTransaction> {
    const [newTransaction] = await db
      .insert(vaultTransactions)
      .values(transaction)
      .returning();
    
    // Update vault balance
    const amount = transaction.type === 'deposit' || transaction.type === 'surplus'
      ? parseFloat(transaction.amount.toString())
      : -parseFloat(transaction.amount.toString());
    
    await this.updateVaultBalance(amount);
    
    // If this is a donation to an initiative, create a member initiative record for "vault donation"
    if (transaction.type === 'donation' && transaction.initiative_id) {
      try {
        // First, check if we need to create a special Vault member
        let vaultMemberId = 0;
        const vaultMember = await db.select().from(members).where(eq(members.first_name, 'Vault')).limit(1);
        
        if (vaultMember.length === 0) {
          // Create the Vault member
          const [newVaultMember] = await db.insert(members).values({
            first_name: 'Vault',
            last_name: 'Donation',
            phone_number: 'vault-system',
            created_at: new Date()
          }).returning();
          
          vaultMemberId = newVaultMember.id;
          console.log(`Created Vault member with ID ${vaultMemberId}`);
        } else {
          vaultMemberId = vaultMember[0].id;
        }
        
        // Now create the member initiative record using the vault member
        await db.insert(memberInitiatives).values({
          member_id: vaultMemberId,
          initiative_id: transaction.initiative_id,
          role: 'donor',
          amount: transaction.amount,
          participation_date: new Date(),
        });
        
        console.log(`Created member initiative record for vault donation to initiative ${transaction.initiative_id}`);
      } catch (error) {
        console.error("Error creating member initiative for vault donation:", error);
        // Don't throw the error, as the transaction itself was successful
      }
    }
    
    return newTransaction;
  }

  async updateVaultBalance(amount: number): Promise<number> {
    const [balanceRecord] = await db.select().from(vaultBalance);
    
    if (!balanceRecord) {
      // Create a balance record if none exists
      const [newBalance] = await db
        .insert(vaultBalance)
        .values({ balance: amount.toString() })
        .returning();
      
      return parseFloat(newBalance.balance.toString());
    }
    
    // Update the existing balance
    const currentBalance = parseFloat(balanceRecord.balance.toString());
    const newBalance = currentBalance + amount;
    
    const [updatedBalance] = await db
      .update(vaultBalance)
      .set({ balance: newBalance.toString() })
      .where(eq(vaultBalance.id, balanceRecord.id))
      .returning();
    
    return parseFloat(updatedBalance.balance.toString());
  }

  // Reports
  async getDonationsReport(filters: ReportFilters): Promise<any[]> {
    // Create conditions array to build dynamic query conditions
    const conditions: SQL<unknown>[] = [];
    
    // Base query
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
    
    // Apply date range filters
    if (filters.startDate) {
      conditions.push(sql`mi.participation_date >= ${new Date(filters.startDate)}`);
    }
    
    if (filters.endDate) {
      conditions.push(sql`mi.participation_date <= ${new Date(filters.endDate)}`);
    }
    
    // Apply initiative filter
    if (filters.initiativeId) {
      conditions.push(sql`mi.initiative_id = ${filters.initiativeId}`);
    }
    
    // Apply category filter
    if (filters.categoryId) {
      conditions.push(sql`i.category_id = ${filters.categoryId}`);
    }
    
    // Apply member filter
    if (filters.memberId) {
      conditions.push(sql`mi.member_id = ${filters.memberId}`);
    }
    
    // Apply amount range filters
    if (filters.minAmount !== undefined) {
      conditions.push(sql`CAST(mi.amount AS DECIMAL) >= ${filters.minAmount}`);
    }
    
    if (filters.maxAmount !== undefined) {
      conditions.push(sql`CAST(mi.amount AS DECIMAL) <= ${filters.maxAmount}`);
    }
    
    // Build the query with conditions
    let finalQuery = baseQuery;
    
    // Add conditions with AND operator
    if (conditions.length > 0) {
      conditions.forEach(condition => {
        finalQuery = sql`${finalQuery} AND ${condition}`;
      });
    }
    
    // Add sort
    finalQuery = sql`${finalQuery} ORDER BY mi.participation_date DESC`;
    
    // Execute the query
    const result = await db.execute(finalQuery);
    
    // Process the result to proper types with safer data handling
    return result.map(row => ({
      ...row,
      participation_date: row.participation_date ? new Date(row.participation_date) : new Date(),
      amount: row.amount ? parseFloat(row.amount) : 0
    }));
  }
  
  async getBeneficiariesReport(filters: ReportFilters): Promise<any[]> {
    // Create conditions array to build dynamic query conditions
    const conditions: SQL<unknown>[] = [];
    
    // Base query
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
    
    // Apply date range filters
    if (filters.startDate) {
      conditions.push(sql`mi.participation_date >= ${new Date(filters.startDate)}`);
    }
    
    if (filters.endDate) {
      conditions.push(sql`mi.participation_date <= ${new Date(filters.endDate)}`);
    }
    
    // Apply initiative filter
    if (filters.initiativeId) {
      conditions.push(sql`mi.initiative_id = ${filters.initiativeId}`);
    }
    
    // Apply category filter
    if (filters.categoryId) {
      conditions.push(sql`i.category_id = ${filters.categoryId}`);
    }
    
    // Apply member filter
    if (filters.memberId) {
      conditions.push(sql`mi.member_id = ${filters.memberId}`);
    }
    
    // Apply amount range filters
    if (filters.minAmount !== undefined) {
      conditions.push(sql`CAST(mi.amount AS DECIMAL) >= ${filters.minAmount}`);
    }
    
    if (filters.maxAmount !== undefined) {
      conditions.push(sql`CAST(mi.amount AS DECIMAL) <= ${filters.maxAmount}`);
    }
    
    // Build the query with conditions
    let finalQuery = baseQuery;
    
    // Add conditions with AND operator
    if (conditions.length > 0) {
      conditions.forEach(condition => {
        finalQuery = sql`${finalQuery} AND ${condition}`;
      });
    }
    
    // Add sort
    finalQuery = sql`${finalQuery} ORDER BY mi.participation_date DESC`;
    
    // Execute the query
    const result = await db.execute(finalQuery);
    
    // Process the result to proper types with safer data handling
    return result.map(row => ({
      ...row,
      participation_date: row.participation_date ? new Date(row.participation_date) : new Date(),
      amount: row.amount ? parseFloat(row.amount) : 0
    }));
  }
  
  async getInitiativesReport(filters: ReportFilters): Promise<any[]> {
    // Create conditions array to build dynamic query conditions
    const conditions: SQL<unknown>[] = [];
    
    // Base query
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
    
    // Apply date range filters for initiative start date
    if (filters.startDate) {
      conditions.push(sql`i.starting_date >= ${new Date(filters.startDate)}`);
    }
    
    if (filters.endDate) {
      conditions.push(sql`i.ending_date <= ${new Date(filters.endDate)}`);
    }
    
    // Apply initiative filter
    if (filters.initiativeId) {
      conditions.push(sql`i.id = ${filters.initiativeId}`);
    }
    
    // Apply category filter
    if (filters.categoryId) {
      conditions.push(sql`i.category_id = ${filters.categoryId}`);
    }
    
    // Apply status filter
    if (filters.status) {
      conditions.push(sql`i.status = ${filters.status}`);
    }
    
    // Build the query with conditions
    let finalQuery = baseQuery;
    
    // Add conditions with WHERE clause if any
    if (conditions.length > 0) {
      let whereClause = sql`WHERE ${conditions[0]}`;
      
      // Add additional conditions with AND
      for (let i = 1; i < conditions.length; i++) {
        whereClause = sql`${whereClause} AND ${conditions[i]}`;
      }
      
      finalQuery = sql`${baseQuery} ${whereClause}`;
    }
    
    // Add sort
    finalQuery = sql`${finalQuery} ORDER BY i.created_at DESC`;
    
    // Execute the query
    const result = await db.execute(finalQuery);
    
    // Process the result to proper types with safer data handling
    return result.map(row => ({
      ...row,
      starting_date: row.starting_date ? new Date(row.starting_date) : new Date(),
      ending_date: row.ending_date ? new Date(row.ending_date) : new Date(),
      created_at: row.created_at ? new Date(row.created_at) : new Date(),
      donations_goal: row.donations_goal ? parseFloat(row.donations_goal) : 0,
      total_donors: row.total_donors ? parseInt(row.total_donors) : 0,
      total_donations: row.total_donations ? parseFloat(row.total_donations) : 0,
      total_beneficiaries: row.total_beneficiaries ? parseInt(row.total_beneficiaries) : 0,
      total_beneficiaries_amount: row.total_beneficiaries_amount ? parseFloat(row.total_beneficiaries_amount) : 0
    }));
  }
  
  async getMembersActivityReport(filters: ReportFilters): Promise<any[]> {
    // Create conditions array to build dynamic query conditions
    const conditions: SQL<unknown>[] = [];
    
    // Base query
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
    
    // Apply member filter
    if (filters.memberId) {
      conditions.push(sql`m.id = ${filters.memberId}`);
    }
    
    // Apply role filter as a subquery condition
    if (filters.role) {
      if (filters.role === 'donor') {
        conditions.push(sql`EXISTS (SELECT 1 FROM member_initiatives mi WHERE mi.member_id = m.id AND mi.role = 'donor')`);
      } else if (filters.role === 'beneficiary') {
        conditions.push(sql`EXISTS (SELECT 1 FROM member_initiatives mi WHERE mi.member_id = m.id AND mi.role = 'beneficiary')`);
      }
    }
    
    // Apply date filters to member creation date
    if (filters.startDate) {
      conditions.push(sql`m.created_at >= ${new Date(filters.startDate)}`);
    }
    
    if (filters.endDate) {
      conditions.push(sql`m.created_at <= ${new Date(filters.endDate)}`);
    }
    
    // Build the query with conditions
    let finalQuery = baseQuery;
    
    // Add conditions with WHERE clause if any
    if (conditions.length > 0) {
      let whereClause = sql`WHERE ${conditions[0]}`;
      
      // Add additional conditions with AND
      for (let i = 1; i < conditions.length; i++) {
        whereClause = sql`${whereClause} AND ${conditions[i]}`;
      }
      
      finalQuery = sql`${baseQuery} ${whereClause}`;
    }
    
    // Add sort
    finalQuery = sql`${finalQuery} ORDER BY m.created_at DESC`;
    
    // Execute the query
    const result = await db.execute(finalQuery);
    
    // Process the result to proper types with safer data handling
    return result.map(row => ({
      ...row,
      created_at: row.created_at ? new Date(row.created_at) : new Date(),
      total_donations: row.total_donations ? parseFloat(row.total_donations) : 0,
      total_benefits: row.total_benefits ? parseFloat(row.total_benefits) : 0,
      total_initiatives: row.total_initiatives ? parseInt(row.total_initiatives) : 0,
      donation_count: row.donation_count ? parseInt(row.donation_count) : 0,
      benefit_count: row.benefit_count ? parseInt(row.benefit_count) : 0
    }));
  }
}

export const storage = new DatabaseStorage();
