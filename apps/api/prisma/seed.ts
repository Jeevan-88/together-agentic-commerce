import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import crypto from "node:crypto";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function main() {
  console.log("Starting database seed...");

  // 1. Seed demo user
  const demoEmail = "demo@together.local";
  const demoUser = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {
      name: "Demo User",
      passwordHash: hashPassword("password123"),
    },
    create: {
      name: "Demo User",
      email: demoEmail,
      passwordHash: hashPassword("password123"),
    },
  });
  console.log(`Demo user verified: ${demoUser.email} (id: ${demoUser.id})`);

  // 2. Seed merchants and products
  const merchants = [
    {
      name: "TrailWorks",
      slug: "trailworks",
      products: [
        {
          name: "Urban Trail 25L",
          description: "Lightweight everyday travel backpack with ergonomic straps and 25L cabin-approved capacity.",
          pricePaise: 499900,
          originalPricePaise: 699900,
          imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80",
          category: "Bags",
          rating: 4.8,
          reviewsCount: 342,
          metadata: {
            capacityLitres: 25,
            weightKg: 0.9,
            capacity: "25L",
            weight: "0.9kg",
            feature: "Cabin friendly",
            discountPercent: 28,
            keywords: ["backpack", "travel", "bag", "weekend", "lightweight", "cabin", "laptop", "urban"],
          },
        },
        {
          name: "Summit Trek 38L",
          description: "Multi-day rugged expedition backpack with internal frame and weather-resistant nylon.",
          pricePaise: 749900,
          originalPricePaise: 999900,
          imageUrl: "https://images.unsplash.com/photo-1546938576-6e6a64f317cc?w=600&auto=format&fit=crop&q=80",
          category: "Bags",
          rating: 4.9,
          reviewsCount: 188,
          metadata: {
            capacityLitres: 38,
            weightKg: 1.4,
            capacity: "38L",
            weight: "1.4kg",
            feature: "Rain cover included",
            discountPercent: 25,
            keywords: ["backpack", "hiking", "trekking", "camping", "outdoor", "expedition", "heavy duty", "large"],
          },
        },
        {
          name: "Alpine Daypack 18L",
          description: "Compact mountain daypack built for day hikes, cycling, and swift commutes.",
          pricePaise: 329900,
          originalPricePaise: 449900,
          imageUrl: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&auto=format&fit=crop&q=80",
          category: "Bags",
          rating: 4.6,
          reviewsCount: 95,
          metadata: {
            capacityLitres: 18,
            weightKg: 0.6,
            capacity: "18L",
            weight: "0.6kg",
            feature: "Hydration ready",
            discountPercent: 26,
            keywords: ["daypack", "small backpack", "cycling", "hiking", "light", "compact", "travel"],
          },
        },
      ],
    },
    {
      name: "Northline",
      slug: "northline",
      products: [
        {
          name: "Voyager Carry 28L",
          description: "Spacious business travel backpack with a dedicated 16-inch laptop sleeve and clamshell opening.",
          pricePaise: 549900,
          originalPricePaise: 799900,
          imageUrl: "https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=600&auto=format&fit=crop&q=80",
          category: "Bags",
          rating: 4.9,
          reviewsCount: 420,
          metadata: {
            capacityLitres: 28,
            weightKg: 1.1,
            capacity: "28L",
            weight: "1.1kg",
            feature: "16\" laptop sleeve",
            discountPercent: 31,
            keywords: ["backpack", "business", "laptop sleeve", "work", "travel", "carry on", "tech"],
          },
        },
        {
          name: "Transit Weekender 32L",
          description: "Structured hybrid duffel pack built for 3-5 day getaways with shoe compartment.",
          pricePaise: 689900,
          originalPricePaise: 899900,
          imageUrl: "https://images.unsplash.com/photo-1577733966973-d680bffd2e80?w=600&auto=format&fit=crop&q=80",
          category: "Bags",
          rating: 4.7,
          reviewsCount: 154,
          metadata: {
            capacityLitres: 32,
            weightKg: 1.3,
            capacity: "32L",
            weight: "1.3kg",
            feature: "Shoe compartment",
            discountPercent: 23,
            keywords: ["duffel", "weekender", "travel", "shoes", "trip", "group", "spacious"],
          },
        },
        {
          name: "Aero Duffel 40L",
          description: "Ultra-durable water-resistant duffel bag with convertible backpack carry straps.",
          pricePaise: 479900,
          originalPricePaise: 649900,
          imageUrl: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&auto=format&fit=crop&q=80",
          category: "Bags",
          rating: 4.8,
          reviewsCount: 210,
          metadata: {
            capacityLitres: 40,
            weightKg: 0.9,
            capacity: "40L",
            weight: "0.9kg",
            feature: "Water resistant",
            discountPercent: 26,
            keywords: ["duffel", "gym", "travel", "waterproof", "sports", "flight", "group trip"],
          },
        },
      ],
    },
    {
      name: "MoveDaily",
      slug: "movedaily",
      products: [
        {
          name: "LitePack 24L",
          description: "Minimalist featherlight pack designed for daily transit and city living.",
          pricePaise: 439900,
          originalPricePaise: 599900,
          imageUrl: "https://images.unsplash.com/photo-1509762774605-f07235a08f1f?w=600&auto=format&fit=crop&q=80",
          category: "Bags",
          rating: 4.7,
          reviewsCount: 267,
          metadata: {
            capacityLitres: 24,
            weightKg: 0.7,
            capacity: "24L",
            weight: "0.7kg",
            feature: "Compact design",
            discountPercent: 26,
            keywords: ["backpack", "daily", "commute", "city", "minimalist", "college", "school"],
          },
        },
        {
          name: "Commuter Slim 16L",
          description: "Ultra-thin professional pack for laptops, tablets, and essential daily gear.",
          pricePaise: 299900,
          originalPricePaise: 419900,
          imageUrl: "https://images.unsplash.com/photo-1622560480654-d96214fdc887?w=600&auto=format&fit=crop&q=80",
          category: "Bags",
          rating: 4.5,
          reviewsCount: 138,
          metadata: {
            capacityLitres: 16,
            weightKg: 0.5,
            capacity: "16L",
            weight: "0.5kg",
            feature: "Slim profile",
            discountPercent: 28,
            keywords: ["slim", "office", "laptop", "commuter", "lightweight", "work"],
          },
        },
        {
          name: "Sling Pouch 4L",
          description: "Quick-access crossbody sling bag for phone, passport, wallet, and sunglasses.",
          pricePaise: 149900,
          originalPricePaise: 219900,
          imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80",
          category: "Bags",
          rating: 4.8,
          reviewsCount: 312,
          metadata: {
            capacityLitres: 4,
            weightKg: 0.25,
            capacity: "4L",
            weight: "0.25kg",
            feature: "Water repellent",
            discountPercent: 31,
            keywords: ["sling", "crossbody", "pouch", "passport", "travel pouch", "accessories"],
          },
        },
      ],
    },
    {
      name: "Acoustix",
      slug: "acoustix",
      products: [
        {
          name: "Studio Pro ANC Headphones",
          description: "Over-ear wireless headphones with Hybrid Active Noise Cancellation, 40-hour battery, and hi-res audio.",
          pricePaise: 899900,
          originalPricePaise: 1299900,
          imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
          category: "Audio",
          rating: 4.9,
          reviewsCount: 580,
          metadata: {
            weightKg: 0.25,
            capacity: "40h battery",
            weight: "0.25kg",
            feature: "Active Noise Cancelling",
            discountPercent: 30,
            keywords: ["headphones", "audio", "anc", "wireless", "sound", "noise cancelling", "music", "over ear", "bluetooth"],
          },
        },
        {
          name: "Pulse Wireless Earbuds",
          description: "True wireless earbuds with environmental noise cancellation, low latency mode, and wireless charging case.",
          pricePaise: 349900,
          originalPricePaise: 499900,
          imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80",
          category: "Audio",
          rating: 4.7,
          reviewsCount: 412,
          metadata: {
            weightKg: 0.05,
            capacity: "32h total",
            weight: "0.05kg",
            feature: "IPX5 water resistant",
            discountPercent: 30,
            keywords: ["earbuds", "earphones", "wireless", "bluetooth", "tws", "audio", "music", "mic"],
          },
        },
        {
          name: "SoundWave Portable Speaker",
          description: "Rugged waterproof outdoor bluetooth speaker with deep 360-degree bass and 16-hour playtime.",
          pricePaise: 279900,
          originalPricePaise: 399900,
          imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&auto=format&fit=crop&q=80",
          category: "Audio",
          rating: 4.8,
          reviewsCount: 220,
          metadata: {
            weightKg: 0.45,
            capacity: "16h battery",
            weight: "0.45kg",
            feature: "IPX7 waterproof",
            discountPercent: 30,
            keywords: ["speaker", "bluetooth speaker", "audio", "party", "outdoor", "waterproof", "portable"],
          },
        },
      ],
    },
    {
      name: "ChronoCraft",
      slug: "chronocraft",
      products: [
        {
          name: "Apex Pro GPS Smartwatch",
          description: "AMOLED fitness smartwatch with dual-band GPS, heart rate monitor, sleep tracking, and 12-day battery.",
          pricePaise: 1149900,
          originalPricePaise: 1599900,
          imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
          category: "Wearables",
          rating: 4.9,
          reviewsCount: 389,
          metadata: {
            weightKg: 0.04,
            capacity: "12-day battery",
            weight: "0.04kg",
            feature: "Dual GPS & AMOLED",
            discountPercent: 28,
            keywords: ["smartwatch", "watch", "fitness", "gps", "heart rate", "running", "wearable", "tracker"],
          },
        },
        {
          name: "Horizon Minimalist Chronograph",
          description: "Classic stainless steel analog watch with sapphire crystal glass and genuine Italian leather strap.",
          pricePaise: 629900,
          originalPricePaise: 849900,
          imageUrl: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=80",
          category: "Wearables",
          rating: 4.8,
          reviewsCount: 165,
          metadata: {
            weightKg: 0.08,
            capacity: "5 ATM water resist",
            weight: "0.08kg",
            feature: "Sapphire crystal",
            discountPercent: 25,
            keywords: ["watch", "analog", "chronograph", "leather", "classic", "formal", "dress watch"],
          },
        },
        {
          name: "PulseFit Tracker Band",
          description: "Sleek all-day activity tracker with continuous SpO2, step tracking, and notification alerts.",
          pricePaise: 199900,
          originalPricePaise: 299900,
          imageUrl: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&auto=format&fit=crop&q=80",
          category: "Wearables",
          rating: 4.6,
          reviewsCount: 290,
          metadata: {
            weightKg: 0.02,
            capacity: "14-day battery",
            weight: "0.02kg",
            feature: "SpO2 & Sleep monitor",
            discountPercent: 33,
            keywords: ["fitness band", "tracker", "smart band", "health", "steps", "sleep", "wearable"],
          },
        },
      ],
    },
    {
      name: "UrbanStep",
      slug: "urbanstep",
      products: [
        {
          name: "CloudGlide Everyday Sneaker",
          description: "Ultra-cushioned lifestyle sneaker with breathable knit upper and responsive foam outsole.",
          pricePaise: 449900,
          originalPricePaise: 629900,
          imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
          category: "Footwear",
          rating: 4.8,
          reviewsCount: 650,
          metadata: {
            weightKg: 0.3,
            capacity: "All day comfort",
            weight: "0.3kg",
            feature: "Memory foam insole",
            discountPercent: 28,
            keywords: ["sneakers", "shoes", "kicks", "footwear", "running", "casual", "red sneaker", "comfort"],
          },
        },
        {
          name: "TrailGrip Hiking Shoes",
          description: "Waterproof low-cut trail shoe with Vibram rubber traction for rocky mountain paths.",
          pricePaise: 599900,
          originalPricePaise: 799900,
          imageUrl: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&auto=format&fit=crop&q=80",
          category: "Footwear",
          rating: 4.9,
          reviewsCount: 230,
          metadata: {
            weightKg: 0.45,
            capacity: "Traction grip",
            weight: "0.45kg",
            feature: "Waterproof membrane",
            discountPercent: 25,
            keywords: ["shoes", "hiking shoes", "trail", "outdoor", "trekking shoes", "waterproof shoes", "footwear"],
          },
        },
        {
          name: "Urban Runner Velocity",
          description: "Featherweight marathon and road running shoe engineered with carbon energy plate.",
          pricePaise: 379900,
          originalPricePaise: 519900,
          imageUrl: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=80",
          category: "Footwear",
          rating: 4.7,
          reviewsCount: 195,
          metadata: {
            weightKg: 0.22,
            capacity: "High energy return",
            weight: "0.22kg",
            feature: "Carbon plate",
            discountPercent: 27,
            keywords: ["running shoes", "shoes", "sneakers", "jogging", "gym", "sports", "footwear"],
          },
        },
      ],
    },
    {
      name: "NomadTech",
      slug: "nomadtech",
      products: [
        {
          name: "Magnetic 3-in-1 Foldable Travel Charger",
          description: "Wireless charging station for smartphone, smartwatch, and earbuds with fast USB-C PD.",
          pricePaise: 249900,
          originalPricePaise: 359900,
          imageUrl: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80",
          category: "Tech",
          rating: 4.8,
          reviewsCount: 310,
          metadata: {
            weightKg: 0.15,
            capacity: "15W fast charge",
            weight: "0.15kg",
            feature: "Foldable travel design",
            discountPercent: 30,
            keywords: ["charger", "wireless charger", "travel charger", "tech", "gadgets", "usb-c", "magnetic"],
          },
        },
        {
          name: "Leather Laptop Sleeve 14-inch",
          description: "Water-resistant padded laptop case with magnetic snap closure and soft microfiber lining.",
          pricePaise: 189900,
          originalPricePaise: 279900,
          imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80",
          category: "Tech",
          rating: 4.9,
          reviewsCount: 175,
          metadata: {
            weightKg: 0.2,
            capacity: "Fits up to 14.2\"",
            weight: "0.2kg",
            feature: "Microfiber lining",
            discountPercent: 32,
            keywords: ["laptop sleeve", "laptop case", "leather", "cover", "work", "tech accessory"],
          },
        },
        {
          name: "Tech Cable Portfolio Organizer",
          description: "Zippered accessory pouch with elastic loops for cables, chargers, hard drives, and adapters.",
          pricePaise: 129900,
          originalPricePaise: 189900,
          imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80",
          category: "Tech",
          rating: 4.7,
          reviewsCount: 220,
          metadata: {
            weightKg: 0.18,
            capacity: "Multi-compartment",
            weight: "0.18kg",
            feature: "Splash-proof canvas",
            discountPercent: 31,
            keywords: ["cable organizer", "tech pouch", "travel pouch", "accessories", "gadget organizer", "electronics"],
          },
        },
      ],
    },
  ];

  for (const merchantData of merchants) {
    const merchant = await prisma.merchant.upsert({
      where: {
        slug: merchantData.slug,
      },
      update: {
        name: merchantData.name,
        active: true,
      },
      create: {
        name: merchantData.name,
        slug: merchantData.slug,
      },
    });

    for (const productData of merchantData.products) {
      const productId = `${merchant.slug}-${productData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}`;

      await prisma.product.upsert({
        where: {
          id: productId,
        },
        update: {
          name: productData.name,
          description: productData.description,
          pricePaise: productData.pricePaise,
          originalPricePaise: productData.originalPricePaise,
          imageUrl: productData.imageUrl,
          category: productData.category,
          rating: productData.rating,
          reviewsCount: productData.reviewsCount,
          metadata: productData.metadata,
          active: true,
        },
        create: {
          id: productId,
          merchantId: merchant.id,
          name: productData.name,
          description: productData.description,
          pricePaise: productData.pricePaise,
          originalPricePaise: productData.originalPricePaise,
          imageUrl: productData.imageUrl,
          category: productData.category,
          rating: productData.rating,
          reviewsCount: productData.reviewsCount,
          metadata: productData.metadata,
        },
      });
    }
  }

  console.log(`Catalog seed completed: ${merchants.length} merchants and all products populated.`);
}

main()
  .catch((error) => {
    console.error("Catalog seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
