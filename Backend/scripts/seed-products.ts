import { connectDatabase, closeDatabase, getDatabasePool } from "../src/config/database.js";
import sql from "mssql";

interface SeedProduct {
  sku: string;
  name: string;
  description: string;
  categoryName: string;
  pricePiasters: number;
}

const sampleProducts: SeedProduct[] = [
  // Electronics
  {
    sku: "LAPTOP-DELL-XPS15",
    name: "Dell XPS 15 Laptop",
    description: '15.6" OLED 3.5K, Intel Core i7, 32GB RAM, 1TB NVMe SSD',
    categoryName: "Electronics",
    pricePiasters: 6850000, // 68,500.00 EGP
  },
  {
    sku: "MONITOR-LG-274K",
    name: "LG UltraFine 27\" 4K Monitor",
    description: "27-inch IPS UHD 3840x2160, USB-C 90W PD, sRGB 99%",
    categoryName: "Electronics",
    pricePiasters: 1950000, // 19,500.00 EGP
  },
  {
    sku: "PHONE-PIXEL-9",
    name: "Google Pixel 9 Pro 128GB",
    description: "6.3-inch Super Actua display, Google Tensor G4, Hazel",
    categoryName: "Electronics",
    pricePiasters: 4200000, // 42,000.00 EGP
  },

  // Office
  {
    sku: "CHAIR-ERGO-PRO",
    name: "Ergonomic Mesh Office Chair",
    description: "Adjustable lumbar support, 3D armrests, breathable Korean mesh",
    categoryName: "Office",
    pricePiasters: 750000, // 7,500.00 EGP
  },
  {
    sku: "DESK-STAND-AUTO",
    name: "Motorized Standing Desk 140x70",
    description: "Dual motors, digital keypad with 4 memory presets, anti-collision",
    categoryName: "Office",
    pricePiasters: 1550000, // 15,500.00 EGP
  },
  {
    sku: "DESK-LAMP-LED",
    name: "Dimmable LED Architect Desk Lamp",
    description: "Touch control, 5 color modes, USB charging port, flexible gooseneck",
    categoryName: "Office",
    pricePiasters: 135000, // 1,350.00 EGP
  },

  // Accessories
  {
    sku: "KEYBOARD-MECH-MX",
    name: "Logitech MX Mechanical Keyboard",
    description: "Low-profile tactile quiet switches, Bluetooth & Bolt, smart illumination",
    categoryName: "Accessories",
    pricePiasters: 780000, // 7,800.00 EGP
  },
  {
    sku: "MOUSE-MX-MASTER3S",
    name: "Logitech MX Master 3S Mouse",
    description: "8K DPI any-surface tracking, quiet clicks, MagSpeed electromagnetic scrolling",
    categoryName: "Accessories",
    pricePiasters: 495000, // 4,950.00 EGP
  },
  {
    sku: "HUB-USBC-7IN1",
    name: "Anker USB-C Hub 7-in-1",
    description: "4K@60Hz HDMI, 100W Power Delivery, SD/microSD, 2x USB 3.0",
    categoryName: "Accessories",
    pricePiasters: 195000, // 1,950.00 EGP
  },
  {
    sku: "HEADSET-SONY-WH",
    name: "Sony WH-1000XM5 Wireless Headphones",
    description: "Industry-leading active noise canceling, 30h battery life, multipoint pairing",
    categoryName: "Accessories",
    pricePiasters: 1750000, // 17,500.00 EGP
  },

  // Storage
  {
    sku: "SSD-SAMS-990PRO",
    name: "Samsung 990 PRO NVMe M.2 2TB",
    description: "PCIe 4.0 speeds up to 7450 MB/s read, ideal for workstations & gaming",
    categoryName: "Storage",
    pricePiasters: 920000, // 9,200.00 EGP
  },
  {
    sku: "SSD-EXT-T7-1TB",
    name: "Samsung T7 Shield Portable SSD 1TB",
    description: "Rugged rubber exterior, IP65 water/dust resistant, USB 3.2 Gen 2",
    categoryName: "Storage",
    pricePiasters: 480000, // 4,800.00 EGP
  },
];

async function seed() {
  console.log("🌱 Starting product database seeding...\n");
  const pool = await connectDatabase();

  // Load existing categories
  const catResult = await pool.request().query<{ CategoryId: number; Name: string }>(`
    SELECT CategoryId, Name FROM dbo.Categories;
  `);

  const categoryMap = new Map<string, number>();
  for (const cat of catResult.recordset) {
    categoryMap.set(cat.Name.toLowerCase(), cat.CategoryId);
  }

  let addedCount = 0;
  let skippedCount = 0;

  for (const prod of sampleProducts) {
    const categoryId = categoryMap.get(prod.categoryName.toLowerCase());

    if (!categoryId) {
      console.warn(`⚠️ Category '${prod.categoryName}' not found in DB. Skipping ${prod.sku}.`);
      continue;
    }

    // Check if already exists
    const existing = await pool
      .request()
      .input("sku", sql.NVarChar(50), prod.sku)
      .query("SELECT ProductId FROM dbo.Products WHERE Sku = @sku");

    if (existing.recordset.length > 0) {
      console.log(`ℹ️ [Skipped] SKU: ${prod.sku} already exists.`);
      skippedCount++;
      continue;
    }

    // Insert
    await pool
      .request()
      .input("sku", sql.NVarChar(50), prod.sku)
      .input("name", sql.NVarChar(150), prod.name)
      .input("description", sql.NVarChar(1000), prod.description)
      .input("categoryId", sql.Int, categoryId)
      .input("pricePiasters", sql.Int, prod.pricePiasters)
      .query(`
        INSERT INTO dbo.Products (
          Sku, Name, Description, CategoryId, PricePiasters, StockQuantity, IsActive
        )
        VALUES (
          @sku, @name, @description, @categoryId, @pricePiasters, 0, 1
        );
      `);

    console.log(`✅ [Added] [${prod.categoryName}] ${prod.sku} - ${prod.name}`);
    addedCount++;
  }

  console.log(`\n🎉 Seeding complete! Added: ${addedCount}, Skipped: ${skippedCount}`);
  await closeDatabase();
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});

