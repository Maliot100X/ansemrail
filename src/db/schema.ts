import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  varchar,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userTypeEnum = pgEnum("user_type", ["human", "agent"]);
export const registrationStatusEnum = pgEnum("registration_status", [
  "pending",
  "active",
  "claimed",
  "suspended",
]);
export const agentStatusEnum = pgEnum("agent_status", [
  "stopped",
  "running",
  "error",
]);
export const listingStatusEnum = pgEnum("listing_status", [
  "active",
  "sold",
  "delisted",
  "pending",
]);
export const signalTypeEnum = pgEnum("signal_type", [
  "buy",
  "sell",
  "hold",
  "info",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: userTypeEnum("type").notNull().default("human"),
  email: text("email"),
  googleId: text("google_id"),
  walletAddress: text("wallet_address"),
  clawpumpApiKey: text("clawpump_api_key"),
  moonpayEmail: text("moonpay_email"),
  owsWalletId: text("ows_wallet_id"),
  owsWalletName: text("ows_wallet_name"),
  telegramChatId: text("telegram_chat_id"),
  telegramVerifyCode: text("telegram_verify_code"),
  telegramVerifyExpiry: timestamp("telegram_verify_expiry"),
  ansemPreference: boolean("ansem_preference").notNull().default(true),
  payoutWallet: text("payout_wallet"),
  encryptedKeys: jsonb("encrypted_keys"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const agents = pgTable("agents", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  clawpumpAgentId: text("clawpump_agent_id"),
  name: text("name").notNull(),
  persona: text("persona"),
  model: text("model"),
  status: agentStatusEnum("status").notNull().default("stopped"),
  walletAddress: text("wallet_address"),
  skills: jsonb("skills").$type<string[]>(),
  isPublic: boolean("is_public").notNull().default(true),
  avatarUrl: text("avatar_url"),
  tokenMint: text("token_mint"),
  claimedByUserId: uuid("claimed_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const registrations = pgTable("registrations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  type: userTypeEnum("type").notNull(),
  status: registrationStatusEnum("status").notNull().default("pending"),
  ed25519PublicKey: text("ed25519_public_key"),
  ed25519Signature: text("ed25519_signature"),
  skillMdContent: text("skill_md_content"),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const listings = pgTable("listings", {
  id: uuid("id").defaultRandom().primaryKey(),
  agentId: uuid("agent_id").references(() => agents.id),
  clawpumpAgentId: text("clawpump_agent_id"),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  priceSol: integer("price_sol"),
  status: listingStatusEnum("status").notNull().default("active"),
  sellerUserId: uuid("seller_user_id").references(() => users.id),
  buyerUserId: uuid("buyer_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const bids = pgTable("bids", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id").references(() => listings.id),
  bidderUserId: uuid("bidder_user_id").references(() => users.id),
  amountSol: integer("amount_sol").notNull(),
  message: text("message"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const signals = pgTable("signals", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: signalTypeEnum("type").notNull(),
  source: text("source").notNull(),
  tokenSymbol: text("token_symbol"),
  tokenMint: text("token_mint"),
  message: text("message").notNull(),
  price: text("price"),
  confidence: integer("confidence"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const agentSignals = pgTable("agent_signals", {
  id: uuid("id").defaultRandom().primaryKey(),
  agentId: uuid("agent_id").references(() => agents.id),
  signalId: uuid("signal_id").references(() => signals.id),
  subscribed: boolean("subscribed").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const skills = pgTable("skills", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  source: text("source").notNull().default("ansemrail"),
  skillMdContent: text("skill_md_content"),
  tags: jsonb("tags").$type<string[]>(),
  installed: boolean("installed").notNull().default(false),
  userId: uuid("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const owsPolicies = pgTable("ows_policies", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  policyId: text("policy_id").notNull(),
  name: text("name").notNull(),
  rules: jsonb("rules"),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  sessionToken: text("session_token").notNull().unique(),
  expires: timestamp("expires").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  access_token: text("access_token"),
  refresh_token: text("refresh_token"),
  expires_at: integer("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  agents: many(agents),
  registrations: many(registrations),
  skills: many(skills),
}));

export const agentsRelations = relations(agents, ({ many, one }) => ({
  user: one(users, { fields: [agents.userId], references: [users.id] }),
  signals: many(agentSignals),
}));

export const listingsRelations = relations(listings, ({ many, one }) => ({
  agent: one(agents, { fields: [listings.agentId], references: [agents.id] }),
  bids: many(bids),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;
export type Registration = typeof registrations.$inferSelect;
export type Listing = typeof listings.$inferSelect;
export type Bid = typeof bids.$inferSelect;
export type Signal = typeof signals.$inferSelect;
export type Skill = typeof skills.$inferSelect;
export type OwsPolicy = typeof owsPolicies.$inferSelect;

// --- Reward system (treasure wallet task rewards) ---
export const rewardTasks = pgTable("reward_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // twitter_like | twitter_follow | twitter_comment | twitter_post | buy_coin | holding | teach | custom
  rewardToken: text("reward_token").notNull().default("ANSEM"), // ANSEM | PROJECT | CLAW
  rewardAmount: text("reward_amount").notNull(), // e.g. "100" (ui amount)
  proofJson: jsonb("proof_json"), // e.g. { mint, minBalance, minUsd, postText, mention }
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rewardSubmissions = pgTable("reward_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  taskId: uuid("task_id").references(() => rewardTasks.id),
  proofUrl: text("proof_url"),
  proofWallet: text("proof_wallet"),
  proofHash: text("proof_hash").notNull().unique(), // unique => no double claim
  status: text("status").notNull().default("pending"), // pending | verified | rejected
  verifiedBy: text("verified_by"),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rewardPayments = pgTable("reward_payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  submissionId: uuid("submission_id").references(() => rewardSubmissions.id).notNull().unique(),
  userId: uuid("user_id").references(() => users.id),
  taskId: uuid("task_id").references(() => rewardTasks.id),
  token: text("token").notNull(), // ANSEM | PROJECT | CLAW
  amount: text("amount").notNull(),
  txSignature: text("tx_signature"),
  status: text("status").notNull().default("paid"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Platform config (admin-set values, e.g. reward treasury wallet) ---
export const platformConfig = pgTable("platform_config", {
  key: text("key").primaryKey(),
  value: jsonb("value"), // { address, encryptedKey, setBy, updatedAt }
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type PlatformConfig = typeof platformConfig.$inferSelect;
