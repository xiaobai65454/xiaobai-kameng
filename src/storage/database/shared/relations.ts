import { relations } from "drizzle-orm/relations";
import {
  profiles,
  agentLevels,
  products,
  orders,
  commissions,
  withdrawals,
  messages,
  luckyNumbers,
  operators,
  systemConfig,
  operationLogs,
  smsLogs,
} from "./schema";

// Profile relations
export const profilesRelations = relations(profiles, ({ one, many }) => ({
  level: one(agentLevels, {
    fields: [profiles.levelId],
    references: [agentLevels.id],
  }),
  parent: one(profiles, {
    fields: [profiles.parentId],
    references: [profiles.id],
    relationName: "profile_parent",
  }),
  children: many(profiles, { relationName: "profile_parent" }),
  orders: many(orders),
  commissions: many(commissions),
  withdrawals: many(withdrawals),
  messages: many(messages),
}));

// Agent levels relations
export const agentLevelsRelations = relations(agentLevels, ({ many }) => ({
  profiles: many(profiles),
}));

// Products relations
export const productsRelations = relations(products, ({ many }) => ({
  orders: many(orders),
}));

// Orders relations
export const ordersRelations = relations(orders, ({ one, many }) => ({
  agent: one(profiles, {
    fields: [orders.agentId],
    references: [profiles.id],
  }),
  product: one(products, {
    fields: [orders.productId],
    references: [products.id],
  }),
  commissions: many(commissions),
}));

// Commissions relations
export const commissionsRelations = relations(commissions, ({ one }) => ({
  order: one(orders, {
    fields: [commissions.orderId],
    references: [orders.id],
  }),
  agent: one(profiles, {
    fields: [commissions.agentId],
    references: [profiles.id],
  }),
  fromAgent: one(profiles, {
    fields: [commissions.fromAgentId],
    references: [profiles.id],
  }),
}));

// Withdrawals relations
export const withdrawalsRelations = relations(withdrawals, ({ one }) => ({
  agent: one(profiles, {
    fields: [withdrawals.agentId],
    references: [profiles.id],
  }),
}));

// Messages relations
export const messagesRelations = relations(messages, ({ one }) => ({
  user: one(profiles, {
    fields: [messages.userId],
    references: [profiles.id],
  }),
}));

// Lucky numbers relations
export const luckyNumbersRelations = relations(luckyNumbers, ({ one }) => ({
  reservedBy: one(profiles, {
    fields: [luckyNumbers.reservedBy],
    references: [profiles.id],
  }),
}));

// Operation logs relations
export const operationLogsRelations = relations(operationLogs, ({ one }) => ({
  user: one(profiles, {
    fields: [operationLogs.userId],
    references: [profiles.id],
  }),
}));
