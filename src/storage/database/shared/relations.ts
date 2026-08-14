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
    fields: [profiles.level_id],
    references: [agentLevels.id],
  }),
  parent: one(profiles, {
    fields: [profiles.parent_id],
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
    fields: [orders.agent_id],
    references: [profiles.id],
  }),
  product: one(products, {
    fields: [orders.product_id],
    references: [products.id],
  }),
  commissions: many(commissions),
}));

// Commissions relations
export const commissionsRelations = relations(commissions, ({ one }) => ({
  order: one(orders, {
    fields: [commissions.order_id],
    references: [orders.id],
  }),
  agent: one(profiles, {
    fields: [commissions.agent_id],
    references: [profiles.id],
  }),
  fromAgent: one(profiles, {
    fields: [commissions.from_agent_id],
    references: [profiles.id],
  }),
}));

// Withdrawals relations
export const withdrawalsRelations = relations(withdrawals, ({ one }) => ({
  agent: one(profiles, {
    fields: [withdrawals.agent_id],
    references: [profiles.id],
  }),
}));

// Messages relations
export const messagesRelations = relations(messages, ({ one }) => ({
  user: one(profiles, {
    fields: [messages.user_id],
    references: [profiles.id],
  }),
}));

// Lucky numbers relations
export const luckyNumbersRelations = relations(luckyNumbers, ({ one }) => ({
  reservedBy: one(profiles, {
    fields: [luckyNumbers.reserved_by],
    references: [profiles.id],
  }),
}));

// Operation logs relations
export const operationLogsRelations = relations(operationLogs, ({ one }) => ({
  user: one(profiles, {
    fields: [operationLogs.user_id],
    references: [profiles.id],
  }),
}));
