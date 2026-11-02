-- 002_initial_schema.sql
-- Creates all tables, constraints, and indexes for the Inventory API.
-- Safe to re-run: each object is guarded with IF NOT EXISTS / IF OBJECT_ID IS NULL.

USE [InventoryLearningDb];
GO

-- ============================================================
-- Users table
-- ============================================================
IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users
    (
        UserId       INT IDENTITY(1,1) NOT NULL,
        FullName     NVARCHAR(100) NOT NULL,
        Email        NVARCHAR(320) NOT NULL,
        PasswordHash NVARCHAR(255) NOT NULL,
        Role         NVARCHAR(20) NOT NULL
            CONSTRAINT DF_Users_Role DEFAULT (N'staff'),
        IsActive     BIT NOT NULL
            CONSTRAINT DF_Users_IsActive DEFAULT (1),
        CreatedAt    DATETIME2(3) NOT NULL
            CONSTRAINT DF_Users_CreatedAt DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_Users PRIMARY KEY (UserId),
        CONSTRAINT UQ_Users_Email UNIQUE (Email),
        CONSTRAINT CK_Users_Role CHECK (Role IN (N'admin', N'staff'))
    );
END;
GO

-- ============================================================
-- Categories table
-- ============================================================
IF OBJECT_ID(N'dbo.Categories', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Categories
    (
        CategoryId  INT IDENTITY(1,1) NOT NULL,
        Name        NVARCHAR(100) NOT NULL,
        Description NVARCHAR(500) NULL,
        CreatedAt   DATETIME2(3) NOT NULL
            CONSTRAINT DF_Categories_CreatedAt DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_Categories PRIMARY KEY (CategoryId),
        CONSTRAINT UQ_Categories_Name UNIQUE (Name)
    );
END;
GO

-- ============================================================
-- Products table
-- ============================================================
IF OBJECT_ID(N'dbo.Products', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Products
    (
        ProductId      INT IDENTITY(1,1) NOT NULL,
        Sku            NVARCHAR(50) NOT NULL,
        Name           NVARCHAR(150) NOT NULL,
        Description    NVARCHAR(1000) NULL,
        CategoryId     INT NOT NULL,
        PricePiasters  INT NOT NULL,
        StockQuantity  INT NOT NULL
            CONSTRAINT DF_Products_StockQuantity DEFAULT (0),
        IsActive       BIT NOT NULL
            CONSTRAINT DF_Products_IsActive DEFAULT (1),
        CreatedAt      DATETIME2(3) NOT NULL
            CONSTRAINT DF_Products_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt      DATETIME2(3) NOT NULL
            CONSTRAINT DF_Products_UpdatedAt DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_Products PRIMARY KEY (ProductId),
        CONSTRAINT UQ_Products_Sku UNIQUE (Sku),
        CONSTRAINT CK_Products_PricePiasters CHECK (PricePiasters >= 0),
        CONSTRAINT CK_Products_StockQuantity CHECK (StockQuantity >= 0),
        CONSTRAINT FK_Products_Categories FOREIGN KEY (CategoryId)
            REFERENCES dbo.Categories (CategoryId)
            ON DELETE NO ACTION
    );
END;
GO

-- ============================================================
-- StockMovements table
-- ============================================================
IF OBJECT_ID(N'dbo.StockMovements', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.StockMovements
    (
        StockMovementId INT IDENTITY(1,1) NOT NULL,
        ProductId       INT NOT NULL,
        QuantityChange  INT NOT NULL,
        Reason          NVARCHAR(250) NOT NULL,
        CreatedByUserId INT NOT NULL,
        CreatedAt       DATETIME2(3) NOT NULL
            CONSTRAINT DF_StockMovements_CreatedAt DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_StockMovements PRIMARY KEY (StockMovementId),
        CONSTRAINT CK_StockMovements_QuantityChange CHECK (QuantityChange <> 0),
        CONSTRAINT FK_StockMovements_Products FOREIGN KEY (ProductId)
            REFERENCES dbo.Products (ProductId)
            ON DELETE NO ACTION,
        CONSTRAINT FK_StockMovements_Users FOREIGN KEY (CreatedByUserId)
            REFERENCES dbo.Users (UserId)
            ON DELETE NO ACTION
    );
END;
GO

-- ============================================================
-- Indexes
-- ============================================================

-- Products by category and active status (for filtered product lists)
IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_Products_CategoryId_IsActive'
      AND object_id = OBJECT_ID(N'dbo.Products')
)
BEGIN
    CREATE INDEX IX_Products_CategoryId_IsActive
        ON dbo.Products (CategoryId, IsActive);
END;
GO

-- Stock movements by product, newest first (for movement history queries)
IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_StockMovements_ProductId_CreatedAt'
      AND object_id = OBJECT_ID(N'dbo.StockMovements')
)
BEGIN
    CREATE INDEX IX_StockMovements_ProductId_CreatedAt
        ON dbo.StockMovements (ProductId, CreatedAt DESC, StockMovementId DESC)
        INCLUDE (QuantityChange, Reason, CreatedByUserId);
END;
GO

