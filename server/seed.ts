import { storage } from "./storage";
import { hashPassword } from "./routes"; // Helper we'll need to export from routes or move to utils
// Moving hashPassword to a shared util file would be cleaner, but for now let's just implement a quick hash here
// or better, just rely on the API to create users which hashes them.
// Actually, since we can't easily import the non-exported hashPassword, let's just use the storage layer directly
// and maybe skip hashing for the seed if we want, OR copy the hash logic.
// The best way is to use the API endpoints or storage.createUser if it handles it.
// Wait, storage.createUser does NOT hash. The route does.
// Let's copy the hash logic here for seeding.

import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function seedDatabase() {
  const existingUsers = await storage.getUserByUsername("demo");
  if (existingUsers) return;

  const hashedPassword = await hashPassword("demo123");
  
  const user = await storage.createUser({
    username: "demo",
    password: hashedPassword,
    displayName: "Demo User",
    currency: "PHP",
    paydayConfig: { type: "fixed", dates: [15, 30] }
  });

  console.log("Seeding data for user:", user.id);

  // 1. Routines
  await storage.createRoutine(user.id, {
    title: "Morning Routine",
    steps: ["Make bed", "Drink water", "Meditate 10m", "Review tasks"],
    frequency: "daily",
    isArchived: false
  });

  await storage.createRoutine(user.id, {
    title: "Night Routine",
    steps: ["Journal", "Plan tomorrow", "Read 15m"],
    frequency: "daily",
    isArchived: false
  });

  // 2. Goals
  const goal1 = await storage.createGoal(user.id, {
    title: "Save for Emergency Fund",
    targetDate: new Date("2024-12-31"),
    completed: false,
    milestones: [
      { id: "m1", text: "Save first 10k", completed: true },
      { id: "m2", text: "Save 50k", completed: false },
      { id: "m3", text: "Save 100k", completed: false }
    ]
  });

  // 3. Tasks
  await storage.createTask(user.id, {
    title: "Transfer 5k to savings",
    dueDate: new Date(),
    priority: "high",
    status: "todo",
    tags: ["finance", "urgent"],
    goalId: goal1.id
  });

  await storage.createTask(user.id, {
    title: "Weekly Grocery Run",
    dueDate: new Date(),
    priority: "medium",
    status: "done",
    tags: ["chores"],
    goalId: null
  });

  // 4. Events
  await storage.createEvent(user.id, {
    title: "Team Meeting",
    startTime: new Date(),
    endTime: new Date(Date.now() + 3600000), // +1 hour
    category: "work",
    notes: "Discuss Q3 roadmap"
  });

  // 5. Finance
  // Transactions
  await storage.createTransaction(user.id, {
    type: "income",
    amount: "50000.00",
    date: new Date(),
    category: "Salary",
    note: "Feb 15 Payout",
    isRecurring: true
  });

  await storage.createTransaction(user.id, {
    type: "expense",
    amount: "1500.00",
    date: new Date(),
    category: "Food",
    note: "Lunch with team",
    isRecurring: false
  });

  // Debts
  await storage.createDebt(user.id, {
    name: "Credit Card",
    totalAmount: "25000.00",
    remainingAmount: "12000.00",
    dueDate: new Date("2024-06-30"),
    interestRate: "3.5"
  });

  // Savings
  await storage.createSavingsGoal(user.id, {
    name: "New Laptop",
    targetAmount: "80000.00",
    currentAmount: "35000.00"
  });

  // 6. Journal
  await storage.createJournalEntry(user.id, {
    date: new Date().toISOString().split('T')[0],
    content: "Today was productive. I finished the core backend for the Life OS app. Need to focus on the frontend integration tomorrow.",
    mood: "happy"
  });

  console.log("Seeding complete!");
}
