import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertMemberSchema, 
  insertCategorySchema, 
  insertInitiativeSchema, 
  insertMemberInitiativeSchema, 
  insertVaultTransactionSchema,
  reportFiltersSchema
} from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Error handling middleware
  app.use((req, res, next) => {
    res.handleError = (error: Error) => {
      console.error(error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: error.errors 
        });
      }
      
      return res.status(500).json({ message: error.message || 'An unexpected error occurred' });
    };
    next();
  });
  
  // Members Routes
  app.get('/api/members', async (req, res) => {
    try {
      const members = await storage.getMembers();
      res.json(members);
    } catch (error) {
      res.handleError(error as Error);
    }
  });
  
  app.get('/api/members/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      const member = await storage.getMember(id);
      if (!member) {
        return res.status(404).json({ message: 'Member not found' });
      }
      
      res.json(member);
    } catch (error) {
      res.handleError(error as Error);
    }
  });
  
  app.post('/api/members', async (req, res) => {
    try {
      const memberData = insertMemberSchema.parse(req.body);
      
      // Check if phone number already exists
      const existingMember = await storage.getMemberByPhone(memberData.phone_number);
      if (existingMember) {
        return res.status(400).json({ message: 'A member with this phone number already exists' });
      }
      
      const newMember = await storage.createMember(memberData);
      res.status(201).json(newMember);
    } catch (error) {
      res.handleError(error as Error);
    }
  });
  
  app.put('/api/members/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      // Validate just the fields provided
      const memberData = insertMemberSchema.partial().parse(req.body);
      
      // If updating phone number, check for uniqueness
      if (memberData.phone_number) {
        const existingMember = await storage.getMemberByPhone(memberData.phone_number);
        if (existingMember && existingMember.id !== id) {
          return res.status(400).json({ message: 'A member with this phone number already exists' });
        }
      }
      
      const updatedMember = await storage.updateMember(id, memberData);
      if (!updatedMember) {
        return res.status(404).json({ message: 'Member not found' });
      }
      
      res.json(updatedMember);
    } catch (error) {
      res.handleError(error as Error);
    }
  });
  
  app.get('/api/members/:id/initiatives', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      const memberInitiatives = await storage.getMemberInitiativesByMemberId(id);
      res.json(memberInitiatives);
    } catch (error) {
      res.handleError(error as Error);
    }
  });
  
  // Categories Routes
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.handleError(error as Error);
    }
  });
  
  app.post('/api/categories', async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      
      // Check if category name already exists
      const existingCategory = await storage.getCategoryByName(categoryData.name);
      if (existingCategory) {
        return res.status(400).json({ message: 'A category with this name already exists' });
      }
      
      const newCategory = await storage.createCategory(categoryData);
      res.status(201).json(newCategory);
    } catch (error) {
      res.handleError(error as Error);
    }
  });
  
  // Initiatives Routes
  app.get('/api/initiatives', async (req, res) => {
    try {
      const initiatives = await storage.getInitiatives();
      res.json(initiatives);
    } catch (error) {
      res.handleError(error as Error);
    }
  });
  
  app.get('/api/initiatives/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      const initiative = await storage.getInitiative(id);
      if (!initiative) {
        return res.status(404).json({ message: 'Initiative not found' });
      }
      
      res.json(initiative);
    } catch (error) {
      res.handleError(error as Error);
    }
  });
  
  app.post('/api/initiatives', async (req, res) => {
    try {
      // Parse the data according to our schema
      const parsedData = insertInitiativeSchema.parse(req.body);
      
      // Format the data for database storage
      const initiativeData = {
        ...parsedData,
        // Convert string dates to Date objects
        starting_date: new Date(parsedData.starting_date),
        ending_date: new Date(parsedData.ending_date),
        // Ensure donations_goal is a number
        donations_goal: typeof parsedData.donations_goal === 'string' 
          ? parseFloat(parsedData.donations_goal) 
          : parsedData.donations_goal
      };
      
      // Validate that the category exists
      const category = await storage.getCategory(initiativeData.category_id);
      if (!category) {
        return res.status(400).json({ message: 'Invalid category ID' });
      }
      
      // Validate that end date is after start date
      if (initiativeData.ending_date <= initiativeData.starting_date) {
        return res.status(400).json({ message: 'End date must be after start date' });
      }
      
      const newInitiative = await storage.createInitiative(initiativeData);
      res.status(201).json(newInitiative);
    } catch (error) {
      console.error("Initiative creation error:", error);
      res.handleError(error as Error);
    }
  });
  
  app.put('/api/initiatives/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      // Validate just the fields provided
      const parsedData = insertInitiativeSchema.partial().parse(req.body);
      
      // Format data for database storage
      const initiativeData: any = { ...parsedData };
      
      // Convert string dates to Date objects if present
      if (parsedData.starting_date) {
        initiativeData.starting_date = new Date(parsedData.starting_date);
      }
      
      if (parsedData.ending_date) {
        initiativeData.ending_date = new Date(parsedData.ending_date);
      }
      
      // Convert donations_goal to number if it's a string
      if (parsedData.donations_goal && typeof parsedData.donations_goal === 'string') {
        initiativeData.donations_goal = parseFloat(parsedData.donations_goal);
      }
      
      // If category_id is provided, validate it exists
      if (initiativeData.category_id) {
        const category = await storage.getCategory(initiativeData.category_id);
        if (!category) {
          return res.status(400).json({ message: 'Invalid category ID' });
        }
      }
      
      // If dates are provided, validate end date is after start date
      if (initiativeData.starting_date || initiativeData.ending_date) {
        const initiative = await storage.getInitiative(id);
        if (!initiative) {
          return res.status(404).json({ message: 'Initiative not found' });
        }
        
        const startDate = initiativeData.starting_date 
          ? initiativeData.starting_date
          : initiative.starting_date;
        
        const endDate = initiativeData.ending_date 
          ? initiativeData.ending_date
          : initiative.ending_date;
        
        if (endDate <= startDate) {
          return res.status(400).json({ message: 'End date must be after start date' });
        }
      }
      
      const updatedInitiative = await storage.updateInitiative(id, initiativeData);
      if (!updatedInitiative) {
        return res.status(404).json({ message: 'Initiative not found' });
      }
      
      res.json(updatedInitiative);
    } catch (error) {
      console.error("Initiative update error:", error);
      res.handleError(error as Error);
    }
  });
  
  app.put('/api/initiatives/:id/status', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      const { status } = req.body;
      if (!status || !['upcoming', 'active', 'ended'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }
      
      const updatedInitiative = await storage.updateInitiativeStatus(id, status);
      if (!updatedInitiative) {
        return res.status(404).json({ message: 'Initiative not found' });
      }
      
      res.json(updatedInitiative);
    } catch (error) {
      res.handleError(error as Error);
    }
  });
  
  app.get('/api/initiatives/:id/members', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      const memberInitiatives = await storage.getMemberInitiatives(id);
      res.json(memberInitiatives);
    } catch (error) {
      res.handleError(error as Error);
    }
  });
  
  app.post('/api/initiatives/:id/members', async (req, res) => {
    try {
      console.log("Connecting member to initiative - received data:", JSON.stringify(req.body, null, 2));
      
      const initiativeId = parseInt(req.params.id);
      if (isNaN(initiativeId)) {
        return res.status(400).json({ message: 'Invalid initiative ID format' });
      }
      
      // Validate the initiative exists and is active
      const initiative = await storage.getInitiative(initiativeId);
      if (!initiative) {
        return res.status(404).json({ message: 'Initiative not found' });
      }
      
      if (initiative.status !== 'active') {
        return res.status(400).json({ message: `Cannot add members to an initiative with status: ${initiative.status}` });
      }
      
      // Let the database handle the participation_date with its default value
      
      // Validate the member initiative data
      try {
        const memberInitiativeData = insertMemberInitiativeSchema.parse({
          ...req.body,
          initiative_id: initiativeId
        });
        
        // Validate the member exists
        const member = await storage.getMember(memberInitiativeData.member_id);
        if (!member) {
          return res.status(400).json({ message: 'Invalid member ID' });
        }
        
        console.log("Validated member initiative data:", JSON.stringify(memberInitiativeData, null, 2));
      
        // Add member to initiative
        const newMemberInitiative = await storage.connectMemberToInitiative(memberInitiativeData);
        res.status(201).json(newMemberInitiative);
      } catch (parseError) {
        console.error("Schema validation error:", parseError);
        return res.status(400).json({ 
          message: 'Invalid member initiative data',
          details: parseError instanceof Error ? parseError.message : String(parseError)
        });
      }
    } catch (error) {
      console.error("Error connecting member to initiative:", error);
      res.handleError(error as Error);
    }
  });
  
  app.put('/api/member-initiatives/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      // Validate just the fields provided
      const memberInitiativeData = insertMemberInitiativeSchema.partial().parse(req.body);
      
      const updatedMemberInitiative = await storage.updateMemberInitiative(id, memberInitiativeData);
      if (!updatedMemberInitiative) {
        return res.status(404).json({ message: 'Member initiative not found' });
      }
      
      res.json(updatedMemberInitiative);
    } catch (error) {
      res.handleError(error as Error);
    }
  });
  
  app.delete('/api/member-initiatives/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      const deleted = await storage.deleteMemberInitiative(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Member initiative not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      res.handleError(error as Error);
    }
  });
  
  // Vault Routes
  app.get('/api/vault/balance', async (req, res) => {
    try {
      const balance = await storage.getVaultBalance();
      res.json({ balance });
    } catch (error) {
      res.handleError(error as Error);
    }
  });
  
  app.get('/api/vault/transactions', async (req, res) => {
    try {
      const transactions = await storage.getVaultTransactions();
      res.json(transactions);
    } catch (error) {
      res.handleError(error as Error);
    }
  });
  
  app.post('/api/vault/transactions', async (req, res) => {
    try {
      const transactionData = insertVaultTransactionSchema.parse(req.body);
      
      // Validation for withdrawals and donations
      if (transactionData.type === 'withdraw' || transactionData.type === 'donation') {
        const currentBalance = await storage.getVaultBalance();
        const amount = parseFloat(transactionData.amount.toString());
        
        if (amount > currentBalance) {
          return res.status(400).json({ message: 'Insufficient vault balance' });
        }
      }
      
      // If it's a donation, validate the initiative exists and is active
      if (transactionData.type === 'donation' && transactionData.initiative_id) {
        const initiative = await storage.getInitiative(transactionData.initiative_id);
        if (!initiative) {
          return res.status(400).json({ message: 'Initiative not found' });
        }
        
        if (initiative.status !== 'active') {
          return res.status(400).json({ message: `Cannot donate to an initiative with status: ${initiative.status}` });
        }
      }
      
      const newTransaction = await storage.createVaultTransaction(transactionData);
      res.status(201).json(newTransaction);
    } catch (error) {
      res.handleError(error as Error);
    }
  });
  
  // Reports Routes
  app.get('/api/reports/donations', async (req, res) => {
    try {
      const filters = {
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        initiativeId: req.query.initiativeId ? parseInt(req.query.initiativeId as string) : undefined,
        categoryId: req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined,
        minAmount: req.query.minAmount ? parseFloat(req.query.minAmount as string) : undefined,
        maxAmount: req.query.maxAmount ? parseFloat(req.query.maxAmount as string) : undefined,
        memberId: req.query.memberId ? parseInt(req.query.memberId as string) : undefined
      };
      
      const report = await storage.getDonationsReport(filters);
      res.json(report);
    } catch (error) {
      res.handleError(error as Error);
    }
  });
  
  app.get('/api/reports/beneficiaries', async (req, res) => {
    try {
      const filters = {
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        initiativeId: req.query.initiativeId ? parseInt(req.query.initiativeId as string) : undefined,
        categoryId: req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined,
        minAmount: req.query.minAmount ? parseFloat(req.query.minAmount as string) : undefined,
        maxAmount: req.query.maxAmount ? parseFloat(req.query.maxAmount as string) : undefined,
        memberId: req.query.memberId ? parseInt(req.query.memberId as string) : undefined
      };
      
      const report = await storage.getBeneficiariesReport(filters);
      res.json(report);
    } catch (error) {
      res.handleError(error as Error);
    }
  });
  
  app.get('/api/reports/initiatives', async (req, res) => {
    try {
      const filters = {
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        initiativeId: req.query.initiativeId ? parseInt(req.query.initiativeId as string) : undefined,
        categoryId: req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined,
        status: req.query.status as string | undefined
      };
      
      const report = await storage.getInitiativesReport(filters);
      res.json(report);
    } catch (error) {
      res.handleError(error as Error);
    }
  });
  
  // POST Report endpoints with filters in request body
  app.post('/api/reports/donations', async (req, res) => {
    try {
      const parseResult = reportFiltersSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: 'Invalid filter data', 
          errors: parseResult.error.errors 
        });
      }
      
      const filters = parseResult.data;
      const report = await storage.getDonationsReport(filters);
      res.json(report);
    } catch (error) {
      res.handleError(error as Error);
    }
  });
  
  app.post('/api/reports/beneficiaries', async (req, res) => {
    try {
      const parseResult = reportFiltersSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: 'Invalid filter data', 
          errors: parseResult.error.errors 
        });
      }
      
      const filters = parseResult.data;
      const report = await storage.getBeneficiariesReport(filters);
      res.json(report);
    } catch (error) {
      res.handleError(error as Error);
    }
  });
  
  app.post('/api/reports/initiatives', async (req, res) => {
    try {
      const parseResult = reportFiltersSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: 'Invalid filter data', 
          errors: parseResult.error.errors 
        });
      }
      
      const filters = parseResult.data;
      const report = await storage.getInitiativesReport(filters);
      res.json(report);
    } catch (error) {
      res.handleError(error as Error);
    }
  });
  
  app.post('/api/reports/members', async (req, res) => {
    try {
      const parseResult = reportFiltersSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: 'Invalid filter data', 
          errors: parseResult.error.errors 
        });
      }
      
      const filters = parseResult.data;
      const report = await storage.getMembersActivityReport(filters);
      res.json(report);
    } catch (error) {
      res.handleError(error as Error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
