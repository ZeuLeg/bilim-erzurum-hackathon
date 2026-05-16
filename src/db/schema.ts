import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  role: text('role', { enum: ['citizen', 'staff', 'admin'] }).notNull().default('citizen'),
  email: text('email').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const reports = sqliteTable('reports', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id),
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: text('status', { enum: ['pending', 'in_progress', 'resolved'] })
    .notNull()
    .default('pending'),
  locationLat: real('location_lat').notNull(),
  locationLng: real('location_lng').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const workOrders = sqliteTable('work_orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  departmentName: text('department_name').notNull(),
  description: text('description').notNull(),
  plannedStartDate: integer('planned_start_date', { mode: 'timestamp' }).notNull(),
  plannedEndDate: integer('planned_end_date', { mode: 'timestamp' }).notNull(),
  locationLat: real('location_lat').notNull(),
  locationLng: real('location_lng').notNull(),
  status: text('status', { enum: ['scheduled', 'in_progress', 'completed', 'cancelled'] })
    .notNull()
    .default('scheduled'),
});
