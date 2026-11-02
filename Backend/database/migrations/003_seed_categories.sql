-- 003_seed_categories.sql
-- Inserts starter categories. Safe to re-run (idempotent).

USE [InventoryLearningDb];
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Categories WHERE Name = N'Electronics')
    INSERT INTO dbo.Categories (Name, Description)
    VALUES (N'Electronics', N'Electronic devices and accessories');

IF NOT EXISTS (SELECT 1 FROM dbo.Categories WHERE Name = N'Office')
    INSERT INTO dbo.Categories (Name, Description)
    VALUES (N'Office', N'Office equipment and supplies');

IF NOT EXISTS (SELECT 1 FROM dbo.Categories WHERE Name = N'Accessories')
    INSERT INTO dbo.Categories (Name, Description)
    VALUES (N'Accessories', N'General accessories');
GO

