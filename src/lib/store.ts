/**
 * VULNIX - In-Memory Data Store
 * 
 * Simulates a database using in-memory objects.
 * Data resets on server restart. Suitable for Vercel serverless with caveats
 * (each cold start resets data - acceptable for a pentesting lab).
 */

import { v4 as uuidv4 } from "uuid";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  email: string;
  password: string; // Stored in plain text intentionally (vulnerability)
  name: string;
  bio: string;
  role: "user" | "admin";
  plan: "free" | "pro" | "enterprise";
  credits: number;
  createdAt: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  ownerId: number;
  teamIds: number[];
  status: "active" | "archived" | "completed";
  priority: "low" | "medium" | "high" | "critical";
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: number;
  projectId: number;
  userId: number;
  content: string;
  createdAt: string;
}

export interface Session {
  token: string;
  userId: number;
  createdAt: string;
  expiresAt: string;
}

export interface LogEntry {
  id: number;
  timestamp: string;
  method: string;
  path: string;
  ip: string;
  userId: number | null;
  body: any;
  headers: Record<string, string>;
  statusCode?: number;
}

export interface PromoCode {
  code: string;
  credits: number;
  used: boolean;
  usedBy: number[];
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

const seedUsers: User[] = [
  {
    id: 1,
    email: "admin@vulnix.io",
    password: "admin123",
    name: "Admin User",
    bio: "Platform administrator",
    role: "admin",
    plan: "enterprise",
    credits: 9999,
    createdAt: "2024-01-15T10:00:00Z",
  },
  {
    id: 2,
    email: "alice@example.com",
    password: "password123",
    name: "Alice Johnson",
    bio: "Senior Project Manager with 10 years of experience",
    role: "user",
    plan: "pro",
    credits: 500,
    createdAt: "2024-02-01T09:00:00Z",
  },
  {
    id: 3,
    email: "bob@example.com",
    password: "bob2024",
    name: "Bob Smith",
    bio: "Full-stack developer and team lead",
    role: "user",
    plan: "free",
    credits: 50,
    createdAt: "2024-03-10T14:30:00Z",
  },
  {
    id: 4,
    email: "charlie@example.com",
    password: "charlie!",
    name: "Charlie Brown",
    bio: "UX Designer passionate about accessibility",
    role: "user",
    plan: "pro",
    credits: 250,
    createdAt: "2024-04-05T11:15:00Z",
  },
];

const seedProjects: Project[] = [
  {
    id: 1,
    name: "Website Redesign",
    description: "Complete overhaul of the company website with modern design principles",
    ownerId: 2,
    teamIds: [2, 3, 4],
    status: "active",
    priority: "high",
    createdAt: "2024-02-15T10:00:00Z",
    updatedAt: "2024-06-01T16:00:00Z",
  },
  {
    id: 2,
    name: "Mobile App MVP",
    description: "Build the first version of our mobile application for iOS and Android",
    ownerId: 3,
    teamIds: [3, 4],
    status: "active",
    priority: "critical",
    createdAt: "2024-03-20T09:00:00Z",
    updatedAt: "2024-05-28T12:00:00Z",
  },
  {
    id: 3,
    name: "Q3 Marketing Campaign",
    description: "Plan and execute marketing initiatives for Q3 2024",
    ownerId: 2,
    teamIds: [2],
    status: "active",
    priority: "medium",
    createdAt: "2024-04-01T08:00:00Z",
    updatedAt: "2024-05-15T10:30:00Z",
  },
  {
    id: 4,
    name: "Internal Tools Dashboard",
    description: "Admin dashboard for monitoring internal systems and metrics",
    ownerId: 1,
    teamIds: [1, 3],
    status: "active",
    priority: "low",
    createdAt: "2024-01-20T13:00:00Z",
    updatedAt: "2024-04-10T09:00:00Z",
  },
  {
    id: 5,
    name: "API Integration Layer",
    description: "Build middleware to connect third-party services with our platform",
    ownerId: 4,
    teamIds: [3, 4],
    status: "completed",
    priority: "high",
    createdAt: "2024-02-01T07:00:00Z",
    updatedAt: "2024-05-01T17:00:00Z",
  },
];

const seedComments: Comment[] = [
  {
    id: 1,
    projectId: 1,
    userId: 2,
    content: "Started the wireframes for the new homepage layout.",
    createdAt: "2024-02-16T11:00:00Z",
  },
  {
    id: 2,
    projectId: 1,
    userId: 3,
    content: "Looking good! I'll start setting up the component library this week.",
    createdAt: "2024-02-17T09:30:00Z",
  },
  {
    id: 3,
    projectId: 2,
    userId: 3,
    content: "React Native setup is complete. Ready for feature development.",
    createdAt: "2024-03-21T14:00:00Z",
  },
  {
    id: 4,
    projectId: 2,
    userId: 4,
    content: "Design system tokens have been exported. Integrating now.",
    createdAt: "2024-03-22T10:00:00Z",
  },
];

const seedPromoCodes: PromoCode[] = [
  { code: "WELCOME50", credits: 50, used: false, usedBy: [] },
  { code: "LAUNCH100", credits: 100, used: false, usedBy: [] },
  { code: "VIP500", credits: 500, used: false, usedBy: [] },
];

// ─── Store ───────────────────────────────────────────────────────────────────

class Store {
  users: User[] = [...seedUsers];
  projects: Project[] = [...seedProjects];
  comments: Comment[] = [...seedComments];
  sessions: Session[] = [];
  logs: LogEntry[] = [];
  promoCodes: PromoCode[] = [...seedPromoCodes];

  private nextUserId = 5;
  private nextProjectId = 6;
  private nextCommentId = 5;
  private nextLogId = 1;

  // ─── User Methods ──────────────────────────────────────────────────────

  getUser(id: number): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.users.find((u) => u.email === email);
  }

  createUser(data: Omit<User, "id" | "createdAt" | "credits">): User {
    const user: User = {
      ...data,
      id: this.nextUserId++,
      credits: 100,
      createdAt: new Date().toISOString(),
    };
    this.users.push(user);
    return user;
  }

  updateUser(id: number, data: Partial<User>): User | undefined {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    this.users[idx] = { ...this.users[idx], ...data };
    return this.users[idx];
  }

  getAllUsers(): User[] {
    return this.users;
  }

  // ─── Project Methods ───────────────────────────────────────────────────

  getProject(id: number): Project | undefined {
    return this.projects.find((p) => p.id === id);
  }

  getProjectsByUser(userId: number): Project[] {
    return this.projects.filter(
      (p) => p.ownerId === userId || p.teamIds.includes(userId)
    );
  }

  createProject(data: Omit<Project, "id" | "createdAt" | "updatedAt">): Project {
    const project: Project = {
      ...data,
      id: this.nextProjectId++,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.projects.push(project);
    return project;
  }

  updateProject(id: number, data: Partial<Project>): Project | undefined {
    const idx = this.projects.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;
    this.projects[idx] = {
      ...this.projects[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return this.projects[idx];
  }

  deleteProject(id: number): boolean {
    const idx = this.projects.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.projects.splice(idx, 1);
    return true;
  }

  getAllProjects(): Project[] {
    return this.projects;
  }

  // ─── Comment Methods ───────────────────────────────────────────────────

  getCommentsByProject(projectId: number): Comment[] {
    return this.comments.filter((c) => c.projectId === projectId);
  }

  createComment(data: Omit<Comment, "id" | "createdAt">): Comment {
    const comment: Comment = {
      ...data,
      id: this.nextCommentId++,
      createdAt: new Date().toISOString(),
    };
    this.comments.push(comment);
    return comment;
  }

  // ─── Session Methods ───────────────────────────────────────────────────

  createSession(userId: number, token: string): Session {
    const session: Session = {
      token,
      userId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
    this.sessions.push(session);
    return session;
  }

  getSession(token: string): Session | undefined {
    return this.sessions.find(
      (s) => s.token === token && new Date(s.expiresAt) > new Date()
    );
  }

  deleteSession(token: string): boolean {
    const idx = this.sessions.findIndex((s) => s.token === token);
    if (idx === -1) return false;
    this.sessions.splice(idx, 1);
    return true;
  }

  // ─── Log Methods ───────────────────────────────────────────────────────

  addLog(entry: Omit<LogEntry, "id" | "timestamp">): LogEntry {
    const log: LogEntry = {
      ...entry,
      id: this.nextLogId++,
      timestamp: new Date().toISOString(),
    };
    this.logs.push(log);
    // Keep only last 1000 logs
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
    return log;
  }

  getLogs(limit = 50): LogEntry[] {
    return this.logs.slice(-limit);
  }

  // ─── Promo Methods ─────────────────────────────────────────────────────

  getPromoCode(code: string): PromoCode | undefined {
    return this.promoCodes.find((p) => p.code === code);
  }

  markPromoUsed(code: string, userId: number): void {
    const promo = this.promoCodes.find((p) => p.code === code);
    if (promo) {
      promo.usedBy.push(userId);
    }
  }
}

// Singleton - shared across API routes within the same serverless instance
const globalStore = globalThis as unknown as { __vulnixStore: Store };

if (!globalStore.__vulnixStore) {
  globalStore.__vulnixStore = new Store();
}

export const store = globalStore.__vulnixStore;
