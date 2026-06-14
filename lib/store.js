// Simple file-backed account store with an in-memory fallback.
// Each "account" is one small business that has onboarded to Flowline.
// In production this would be a real database (Postgres/Firestore); the file
// store keeps the demo self-contained and swappable.

import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "accounts.json");

// Fallback used when the filesystem is read-only (e.g. some serverless hosts).
const memory = new Map();
let useMemory = false;

async function readAll() {
  if (useMemory) return Object.fromEntries(memory);
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") return {};
    // Anything else (permissions, parse) -> degrade to memory.
    useMemory = true;
    return Object.fromEntries(memory);
  }
}

async function writeAll(accounts) {
  if (useMemory) {
    memory.clear();
    for (const [k, v] of Object.entries(accounts)) memory.set(k, v);
    return;
  }
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(accounts, null, 2), "utf8");
  } catch {
    useMemory = true;
    memory.clear();
    for (const [k, v] of Object.entries(accounts)) memory.set(k, v);
  }
}

export function newId() {
  return crypto.randomBytes(9).toString("hex");
}

export async function getAccount(id) {
  if (!id) return null;
  const all = await readAll();
  return all[id] || null;
}

export async function findByEmail(email) {
  if (!email) return null;
  const all = await readAll();
  const target = String(email).trim().toLowerCase();
  return (
    Object.values(all).find(
      (a) => (a.email || "").toLowerCase() === target
    ) || null
  );
}

export async function saveAccount(account) {
  const all = await readAll();
  const id = account.id || newId();
  const now = new Date().toISOString();
  const existing = all[id];
  const merged = {
    ...existing,
    ...account,
    id,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  all[id] = merged;
  await writeAll(all);
  return merged;
}

export async function listAccounts() {
  const all = await readAll();
  return Object.values(all);
}
