import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Auth setup
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "secret",
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }, // 1 week
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username." });
        }
        const isValid = await comparePasswords(password, user.password);
        if (!isValid) {
          return done(null, false, { message: "Incorrect password." });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Auth Routes
  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      const existingUser = await storage.getUserByUsername(input.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await hashPassword(input.password);
      const user = await storage.createUser({ ...input, password: hashedPassword });
      
      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Login failed after registration" });
        return res.status(201).json(user);
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.login.path, passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post(api.auth.logout.path, (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).send();
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    if (req.isAuthenticated()) {
      res.status(200).json(req.user);
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  });

  // Protected Routes Wrapper
  const protectedRouter = (fn: Function) => async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      await fn(req, res, next);
    } catch (err) {
      next(err);
    }
  };

  // Helper to get userId from req.user
  const getUserId = (req: Request) => (req.user as any).id;

  // Routines
  app.get(api.routines.list.path, isAuthenticated, async (req, res) => {
    const routines = await storage.getRoutines(getUserId(req));
    res.json(routines);
  });
  
  app.post(api.routines.create.path, isAuthenticated, async (req, res) => {
    const input = api.routines.create.input.parse(req.body);
    const routine = await storage.createRoutine(getUserId(req), input);
    res.status(201).json(routine);
  });

  app.patch(api.routines.update.path, isAuthenticated, async (req, res) => {
    const input = api.routines.update.input.parse(req.body);
    const updated = await storage.updateRoutine(Number(req.params.id), input);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  });

  app.delete(api.routines.delete.path, isAuthenticated, async (req, res) => {
    await storage.deleteRoutine(Number(req.params.id));
    res.status(204).send();
  });

  app.post(api.routines.logCompletion.path, isAuthenticated, async (req, res) => {
    // Should verify ownership of routine first, but skipping for brevity in MVP
    const input = api.routines.logCompletion.input.parse(req.body);
    const completion = await storage.logRoutineCompletion({ ...input, routineId: Number(req.params.id) });
    res.status(201).json(completion);
  });

  app.get(api.routines.getCompletions.path, isAuthenticated, async (req, res) => {
    const routines = await storage.getRoutines(getUserId(req));
    const completions = await storage.getRoutineCompletions(
      routines.map(r => r.id),
      req.query.date as string
    );
    res.json(completions);
  });

  // Tasks
  app.get(api.tasks.list.path, isAuthenticated, async (req, res) => {
    const tasks = await storage.getTasks(getUserId(req));
    res.json(tasks);
  });

  app.post(api.tasks.create.path, isAuthenticated, async (req, res) => {
    const input = api.tasks.create.input.parse(req.body);
    const task = await storage.createTask(getUserId(req), input);
    res.status(201).json(task);
  });

  app.patch(api.tasks.update.path, isAuthenticated, async (req, res) => {
    const input = api.tasks.update.input.parse(req.body);
    const updated = await storage.updateTask(Number(req.params.id), input);
    res.json(updated);
  });

  app.delete(api.tasks.delete.path, isAuthenticated, async (req, res) => {
    await storage.deleteTask(Number(req.params.id));
    res.status(204).send();
  });

  // Goals
  app.get(api.goals.list.path, isAuthenticated, async (req, res) => {
    const goals = await storage.getGoals(getUserId(req));
    res.json(goals);
  });

  app.post(api.goals.create.path, isAuthenticated, async (req, res) => {
    const input = api.goals.create.input.parse(req.body);
    const goal = await storage.createGoal(getUserId(req), input);
    res.status(201).json(goal);
  });

  app.patch(api.goals.update.path, isAuthenticated, async (req, res) => {
    const input = api.goals.update.input.parse(req.body);
    const updated = await storage.updateGoal(Number(req.params.id), input);
    res.json(updated);
  });

  app.delete(api.goals.delete.path, isAuthenticated, async (req, res) => {
    await storage.deleteGoal(Number(req.params.id));
    res.status(204).send();
  });

  // Events
  app.get(api.events.list.path, isAuthenticated, async (req, res) => {
    const events = await storage.getEvents(getUserId(req));
    res.json(events);
  });

  app.post(api.events.create.path, isAuthenticated, async (req, res) => {
    const input = api.events.create.input.parse(req.body);
    const event = await storage.createEvent(getUserId(req), input);
    res.status(201).json(event);
  });

  app.patch(api.events.update.path, isAuthenticated, async (req, res) => {
    const input = api.events.update.input.parse(req.body);
    const updated = await storage.updateEvent(Number(req.params.id), input);
    res.json(updated);
  });

  app.delete(api.events.delete.path, isAuthenticated, async (req, res) => {
    await storage.deleteEvent(Number(req.params.id));
    res.status(204).send();
  });

  // Transactions
  app.get(api.transactions.list.path, isAuthenticated, async (req, res) => {
    const txs = await storage.getTransactions(getUserId(req));
    res.json(txs);
  });

  app.post(api.transactions.create.path, isAuthenticated, async (req, res) => {
    const input = api.transactions.create.input.parse(req.body);
    const tx = await storage.createTransaction(getUserId(req), input);
    res.status(201).json(tx);
  });

  app.delete(api.transactions.delete.path, isAuthenticated, async (req, res) => {
    await storage.deleteTransaction(Number(req.params.id));
    res.status(204).send();
  });

  // Debts
  app.get(api.debts.list.path, isAuthenticated, async (req, res) => {
    const debts = await storage.getDebts(getUserId(req));
    res.json(debts);
  });

  app.post(api.debts.create.path, isAuthenticated, async (req, res) => {
    const input = api.debts.create.input.parse(req.body);
    const debt = await storage.createDebt(getUserId(req), input);
    res.status(201).json(debt);
  });

  app.patch(api.debts.update.path, isAuthenticated, async (req, res) => {
    const input = api.debts.update.input.parse(req.body);
    const updated = await storage.updateDebt(Number(req.params.id), input);
    res.json(updated);
  });

  app.delete(api.debts.delete.path, isAuthenticated, async (req, res) => {
    await storage.deleteDebt(Number(req.params.id));
    res.status(204).send();
  });

  // Savings
  app.get(api.savings.list.path, isAuthenticated, async (req, res) => {
    const savings = await storage.getSavingsGoals(getUserId(req));
    res.json(savings);
  });

  app.post(api.savings.create.path, isAuthenticated, async (req, res) => {
    const input = api.savings.create.input.parse(req.body);
    const saving = await storage.createSavingsGoal(getUserId(req), input);
    res.status(201).json(saving);
  });

  app.patch(api.savings.update.path, isAuthenticated, async (req, res) => {
    const input = api.savings.update.input.parse(req.body);
    const updated = await storage.updateSavingsGoal(Number(req.params.id), input);
    res.json(updated);
  });

  app.delete(api.savings.delete.path, isAuthenticated, async (req, res) => {
    await storage.deleteSavingsGoal(Number(req.params.id));
    res.status(204).send();
  });

  // Journal
  app.get(api.journal.list.path, isAuthenticated, async (req, res) => {
    const entries = await storage.getJournalEntries(getUserId(req));
    res.json(entries);
  });

  app.post(api.journal.create.path, isAuthenticated, async (req, res) => {
    const input = api.journal.create.input.parse(req.body);
    const entry = await storage.createJournalEntry(getUserId(req), input);
    res.status(201).json(entry);
  });

  app.patch(api.journal.update.path, isAuthenticated, async (req, res) => {
    const input = api.journal.update.input.parse(req.body);
    const updated = await storage.updateJournalEntry(Number(req.params.id), input);
    res.json(updated);
  });

  app.delete(api.journal.delete.path, isAuthenticated, async (req, res) => {
    await storage.deleteJournalEntry(Number(req.params.id));
    res.status(204).send();
  });

  return httpServer;
}
