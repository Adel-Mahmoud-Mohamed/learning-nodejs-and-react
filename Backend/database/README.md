# Database Migrations

This folder contains SQL scripts for setting up the `InventoryLearningDb` database.

## How to run

Run these scripts **manually** in SQL Server Management Studio (SSMS) or Azure Data Studio, in order:

1. `001_create_database.sql` — Creates the database if it doesn't exist.
2. `002_initial_schema.sql` — Creates all tables, constraints, and indexes.
3. `003_seed_categories.sql` — Inserts starter categories (idempotent).

> **Important:** Never run these scripts against a production database without reviewing them first.
> These scripts are safe to re-run — they use `IF NOT EXISTS` checks.

