import { pgTable, serial, timestamp, varchar, text, integer, numeric, boolean, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const healthCheck = pgTable("health_check", {
  id: serial().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 代理等级表
export const agentLevels = pgTable(
  "agent_levels",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 50 }).notNull(),
    level: integer("level").notNull().default(1),
    commission_rate: numeric("commission_rate", { precision: 5, scale: 2 }).notNull().default("0"),
    min_orders: integer("min_orders").notNull().default(0),
    min_team_size: integer("min_team_size").notNull().default(0),
    min_sales: numeric("min_sales", { precision: 12, scale: 2 }).notNull().default("0"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("agent_levels_level_idx").on(table.level),
  ]
);

// 用户档案表（关联 Supabase auth.users）
export const profiles = pgTable(
  "profiles",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    name: varchar("name", { length: 128 }).notNull(),
    role: varchar("role", { length: 20 }).notNull().default("agent"),
    invite_code: varchar("invite_code", { length: 20 }).notNull().unique(),
    parent_id: varchar("parent_id", { length: 36 }).references((): any => profiles.id),
    level_id: varchar("level_id", { length: 36 }).references(() => agentLevels.id),
    total_sales: numeric("total_sales", { precision: 12, scale: 2 }).notNull().default("0"),
    total_orders: integer("total_orders").notNull().default(0),
    team_count: integer("team_count").notNull().default(0),
    balance: numeric("balance", { precision: 12, scale: 2 }).notNull().default("0"),
    is_active: boolean("is_active").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("profiles_email_idx").on(table.email),
    index("profiles_invite_code_idx").on(table.invite_code),
    index("profiles_parent_id_idx").on(table.parent_id),
    index("profiles_role_idx").on(table.role),
    index("profiles_level_id_idx").on(table.level_id),
  ]
);

// 号卡产品表（改造为号卡专用）
export const products = pgTable(
  "products",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    // 运营商：mobile/unicom/telecom/broadnet
    operator: varchar("operator", { length: 20 }).notNull().default("mobile"),
    // 月租价格
    monthly_rent: numeric("monthly_rent", { precision: 10, scale: 2 }).notNull().default("0"),
    // 通用流量（GB）
    general_data: integer("general_data").notNull().default(0),
    // 定向流量（GB）
    directed_data: integer("directed_data").notNull().default(0),
    // 通话时长（分钟）
    call_minutes: integer("call_minutes").notNull().default(0),
    // 有效期（月）
    validity_months: integer("validity_months").notNull().default(12),
    // 佣金金额
    commission_amount: numeric("commission_amount", { precision: 10, scale: 2 }).notNull().default("0"),
    // 年龄限制
    age_limit: varchar("age_limit", { length: 50 }),
    // 地区限制
    area_limit: text("area_limit"),
    // 状态：active/inactive
    status: varchar("status", { length: 20 }).notNull().default("active"),
    // 排序
    sort_order: integer("sort_order").notNull().default(0),
    // 标签：主推/新品等
    tags: varchar("tags", { length: 100 }),
    // 图片URL
    image_url: varchar("image_url", { length: 500 }),
    // 推广链接
    promo_url: varchar("promo_url", { length: 500 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("products_status_idx").on(table.status),
    index("products_operator_idx").on(table.operator),
    index("products_created_at_idx").on(table.created_at),
  ]
);

// 订单表（改造为号卡订单）
export const orders = pgTable(
  "orders",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    order_no: varchar("order_no", { length: 32 }).notNull().unique(),
    agent_id: varchar("agent_id", { length: 36 }).notNull().references(() => profiles.id),
    product_id: varchar("product_id", { length: 36 }).notNull().references(() => products.id),
    // 订单来源：online线上 / manual手动报单
    source: varchar("source", { length: 20 }).notNull().default("online"),
    // 收货信息
    customer_name: varchar("customer_name", { length: 100 }),
    customer_phone: varchar("customer_phone", { length: 20 }),
    customer_id_card: varchar("customer_id_card", { length: 30 }),
    customer_address: text("customer_address"),
    // 选号
    selected_number: varchar("selected_number", { length: 30 }),
    // 号卡信息
    iccid: varchar("iccid", { length: 50 }),
    phone_number: varchar("phone_number", { length: 20 }),
    // 佣金
    commission_amount: numeric("commission_amount", { precision: 10, scale: 2 }).notNull().default("0"),
    // 订单状态：pending/approved/activated/shipped/completed/cancelled
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    // 手动报单：办理方式
    handling_method: varchar("handling_method", { length: 20 }),
    handling_other: text("handling_other"),
    // 手动报单：凭证图片
    evidence_images: text("evidence_images").array(),
    // 审核
    audit_reason: text("audit_reason"),
    audit_time: timestamp("audit_time", { withTimezone: true }),
    audit_by: varchar("audit_by", { length: 36 }),
    // 审核备注
    remark: text("remark"),
    admin_remark: text("admin_remark"),
    // 运营商订单号
    operator_order_no: varchar("operator_order_no", { length: 100 }),
    // 报单信息
    new_phone_number: varchar("new_phone_number", { length: 50 }),
    // 下单时间（冗余字段，便于排序）
    order_source: varchar("order_source", { length: 20 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("orders_order_no_idx").on(table.order_no),
    index("orders_agent_id_idx").on(table.agent_id),
    index("orders_product_id_idx").on(table.product_id),
    index("orders_status_idx").on(table.status),
    index("orders_source_idx").on(table.source),
    index("orders_created_at_idx").on(table.created_at),
  ]
);

// 站内消息表
export const messages = pgTable(
  "messages",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    user_id: varchar("user_id", { length: 36 }).notNull(),
    type: varchar("type", { length: 20 }).notNull().default("system"),
    title: varchar("title", { length: 200 }).notNull(),
    content: text("content").notNull(),
    is_read: boolean("is_read").notNull().default(false),
    related_order_id: varchar("related_order_id", { length: 36 }),
    related_id: varchar("related_id", { length: 36 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("messages_user_id_idx").on(table.user_id),
    index("messages_is_read_idx").on(table.is_read),
  ]
);

// 佣金记录表
export const commissions = pgTable(
  "commissions",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    order_id: varchar("order_id", { length: 36 }).notNull().references(() => orders.id),
    agent_id: varchar("agent_id", { length: 36 }).notNull().references(() => profiles.id),
    from_agent_id: varchar("from_agent_id", { length: 36 }).notNull().references(() => profiles.id),
    level: integer("level").notNull(),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("commissions_order_id_idx").on(table.order_id),
    index("commissions_agent_id_idx").on(table.agent_id),
    index("commissions_from_agent_id_idx").on(table.from_agent_id),
    index("commissions_status_idx").on(table.status),
  ]
);

// 提现申请表
export const withdrawals = pgTable(
  "withdrawals",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    agent_id: varchar("agent_id", { length: 36 }).notNull().references(() => profiles.id),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    remark: text("remark"),
    admin_remark: text("admin_remark"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("withdrawals_agent_id_idx").on(table.agent_id),
    index("withdrawals_status_idx").on(table.status),
    index("withdrawals_created_at_idx").on(table.created_at),
  ]
);

// 靓号池表
export const luckyNumbers = pgTable(
  "lucky_numbers",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    number: varchar("number", { length: 20 }).notNull().unique(),
    pattern: varchar("pattern", { length: 50 }),
    level: varchar("level", { length: 20 }).notNull().default("normal"),
    price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
    operator: varchar("operator", { length: 20 }),
    status: varchar("status", { length: 20 }).notNull().default("available"),
    reserved_by: varchar("reserved_by", { length: 36 }),
    reserved_at: timestamp("reserved_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("lucky_numbers_number_idx").on(table.number),
    index("lucky_numbers_status_idx").on(table.status),
    index("lucky_numbers_operator_idx").on(table.operator),
    index("lucky_numbers_level_idx").on(table.level),
  ]
);

// 运营商配置表
export const operators = pgTable(
  "operators",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 50 }).notNull(),
    code: varchar("code", { length: 20 }).notNull().unique(),
    logo_url: varchar("logo_url", { length: 500 }),
    api_url: varchar("api_url", { length: 500 }),
    api_key: varchar("api_key", { length: 200 }),
    api_secret: varchar("api_secret", { length: 200 }),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    sort_order: integer("sort_order").notNull().default(0),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("operators_code_idx").on(table.code),
    index("operators_status_idx").on(table.status),
  ]
);

// 系统配置表
export const systemConfig = pgTable(
  "system_config",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    config_key: varchar("config_key", { length: 100 }).notNull().unique(),
    config_value: text("config_value"),
    config_type: varchar("config_type", { length: 20 }).notNull().default("string"),
    description: varchar("description", { length: 500 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("system_config_key_idx").on(table.config_key),
  ]
);

// 短信记录表
export const smsLogs = pgTable(
  "sms_logs",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    phone: varchar("phone", { length: 20 }).notNull(),
    content: text("content"),
    template_code: varchar("template_code", { length: 50 }),
    result: text("result"),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("sms_logs_phone_idx").on(table.phone),
    index("sms_logs_created_at_idx").on(table.created_at),
  ]
);

// 操作日志表
export const operationLogs = pgTable(
  "operation_logs",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    user_id: varchar("user_id", { length: 36 }),
    user_name: varchar("user_name", { length: 128 }),
    action: varchar("action", { length: 100 }).notNull(),
    module: varchar("module", { length: 50 }),
    detail: text("detail"),
    ip: varchar("ip", { length: 50 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("operation_logs_user_id_idx").on(table.user_id),
    index("operation_logs_created_at_idx").on(table.created_at),
    index("operation_logs_module_idx").on(table.module),
  ]
);
