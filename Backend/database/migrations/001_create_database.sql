-- 001_create_database.sql
-- Creates the InventoryLearningDb database if it does not already exist.
-- Safe to re-run.

IF DB_ID(N'InventoryLearningDb') IS NULL
BEGIN
    CREATE DATABASE [InventoryLearningDb];
END;
GO

