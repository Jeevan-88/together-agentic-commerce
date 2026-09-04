import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

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

async function main() {
  const merchants = [
    {
      name: "TrailWorks",
      slug: "trailworks",
      products: [
        {
          name: "Urban Trail 25L",
          description: "Lightweight everyday travel backpack with ergonomic straps and 25L cabin-approved capacity.",
          pricePaise: 499900,
          metadata: {
            imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80",
            category: "Bags",
            originalPricePaise: 699900,
            discountPercent: 28,
            rating: 4.8,
            reviewsCount: 342,
            capacity: "25L",
            weight: "0.9kg",
            feature: "Cabin friendly",
            keywords: ["backpack", "travel", "bag", "weekend", "lightweight", "cabin", "laptop", "urban"],
          },
        },
        {
          name: "Summit Trek 38L",
          description: "Multi-day rugged expedition backpack with internal frame and weather-resistant nylon.",
          pricePaise: 749900,
          metadata: {
            imageUrl: "https://images.unsplash.com/photo-1546938576-6e6a64f317cc?w=600&auto=format&fit=crop&q=80",
            category: "Bags",
            originalPricePaise: 999900,
            discountPercent: 25,
            rating: 4.9,
            reviewsCount: 188,
            capacity: "38L",
            weight: "1.4kg",
            feature: "Rain cover included",
            keywords: ["backpack", "hiking", "trekking", "camping", "outdoor", "expedition", "heavy duty", "large"],
          },
        },
        {
          name: "Alpine Daypack 18L",
          description: "Compact mountain daypack built for day hikes, cycling, and swift commutes.",
          pricePaise: 329900,
          metadata: {
            imageUrl: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&auto=format&fit=crop&q=80",
            category: "Bags",
            originalPricePaise: 449900,
            discountPercent: 26,
            rating: 4.6,
            reviewsCount: 95,
            capacity: "18L",
            weight: "0.6kg",
            feature: "Hydration ready",
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
          metadata: {
            imageUrl: "https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=600&auto=format&fit=crop&q=80",
            category: "Bags",
            originalPricePaise: 799900,
            discountPercent: 31,
            rating: 4.9,
            reviewsCount: 420,
            capacity: "28L",
            weight: "1.1kg",
            feature: "16\" laptop sleeve",
            keywords: ["backpack", "business", "laptop sleeve", "work", "travel", "carry on", "tech"],
          },
        },
        {
          name: "Transit Weekender 32L",
          description: "Structured hybrid duffel pack built for 3-5 day getaways with shoe compartment.",
          pricePaise: 689900,
          metadata: {
            imageUrl: "https://images.unsplash.com/photo-1577733966973-d680bffd2e80?w=600&auto=format&fit=crop&q=80",
            category: "Bags",
            originalPricePaise: 899900,
            discountPercent: 23,
            rating: 4.7,
            reviewsCount: 154,
            capacity: "32L",
            weight: "1.3kg",
            feature: "Shoe compartment",
            keywords: ["duffel", "weekender", "travel", "shoes", "trip", "group", "spacious"],
          },
        },
        {
          name: "Aero Duffel 40L",
          description: "Ultra-durable water-resistant duffel bag with convertible backpack carry straps.",
          pricePaise: 479900,
          metadata: {
            imageUrl: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&auto=format&fit=crop&q=80",
            category: "Bags",
            originalPricePaise: 649900,
            discountPercent: 26,
            rating: 4.8,
            reviewsCount: 210,
            capacity: "40L",
            weight: "0.9kg",
            feature: "Water resistant",
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
          metadata: {
            imageUrl: "https://images.unsplash.com/photo-1509762774605-f07235a08f1f?w=600&auto=format&fit=crop&q=80",
            category: "Bags",
            originalPricePaise: 599900,
            discountPercent: 26,
            rating: 4.7,
            reviewsCount: 267,
            capacity: "24L",
            weight: "0.7kg",
            feature: "Compact design",
            keywords: ["backpack", "daily", "commute", "city", "minimalist", "college", "school"],
          },
        },
        {
          name: "Commuter Slim 16L",
          description: "Ultra-thin professional pack for laptops, tablets, and essential daily gear.",
          pricePaise: 299900,
          metadata: {
            imageUrl: "https://images.unsplash.com/photo-1622560480654-d96214fdc887?w=600&auto=format&fit=crop&q=80",
            category: "Bags",
            originalPricePaise: 419900,
            discountPercent: 28,
            rating: 4.5,
            reviewsCount: 138,
            capacity: "16L",
            weight: "0.5kg",
            feature: "Slim profile",
            keywords: ["slim", "office", "laptop", "commuter", "lightweight", "work"],
          },
        },
        {
          name: "Sling Pouch 4L",
          description: "Quick-access crossbody sling bag for phone, passport, wallet, and sunglasses.",
          pricePaise: 149900,
          metadata: {
            imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80",
            category: "Bags",
            originalPricePaise: 219900,
            discountPercent: 31,
            rating: 4.8,
            reviewsCount: 312,
            capacity: "4L",
            weight: "0.25kg",
            feature: "Water repellent",
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
          metadata: {
            imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
            category: "Audio",
            originalPricePaise: 1299900,
            discountPercent: 30,
            rating: 4.9,
            reviewsCount: 580,
            capacity: "40h battery",
            weight: "0.25kg",
            feature: "Active Noise Cancelling",
            keywords: ["headphones", "audio", "anc", "wireless", "sound", "noise cancelling", "music", "over ear", "bluetooth"],
          },
        },
        {
          name: "Pulse Wireless Earbuds",
          description: "True wireless earbuds with environmental noise cancellation, low latency mode, and wireless charging case.",
          pricePaise: 349900,
          metadata: {
            imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80",
            category: "Audio",
            originalPricePaise: 499900,
            discountPercent: 30,
            rating: 4.7,
            reviewsCount: 412,
            capacity: "32h total",
            weight: "0.05kg",
            feature: "IPX5 water resistant",
            keywords: ["earbuds", "earphones", "wireless", "bluetooth", "tws", "audio", "music", "mic"],
          },
        },
        {
          name: "SoundWave Portable Speaker",
          description: "Rugged waterproof outdoor bluetooth speaker with deep 360-degree bass and 16-hour playtime.",
          pricePaise: 279900,
          metadata: {
            imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&auto=format&fit=crop&q=80",
            category: "Audio",
            originalPricePaise: 399900,
            discountPercent: 30,
            rating: 4.8,
            reviewsCount: 220,
            capacity: "16h battery",
            weight: "0.45kg",
            feature: "IPX7 waterproof",
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
          metadata: {
            imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
            category: "Wearables",
            originalPricePaise: 1599900,
            discountPercent: 28,
            rating: 4.9,
            reviewsCount: 389,
            capacity: "12-day battery",
            weight: "0.04kg",
            feature: "Dual GPS & AMOLED",
            keywords: ["smartwatch", "watch", "fitness", "gps", "heart rate", "running", "wearable", "tracker"],
          },
        },
        {
          name: "Horizon Minimalist Chronograph",
          description: "Classic stainless steel analog watch with sapphire crystal glass and genuine Italian leather strap.",
          pricePaise: 629900,
          metadata: {
            imageUrl: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=80",
            category: "Wearables",
            originalPricePaise: 849900,
            discountPercent: 25,
            rating: 4.8,
            reviewsCount: 165,
            capacity: "5 ATM water resist",
            weight: "0.08kg",
            feature: "Sapphire crystal",
            keywords: ["watch", "analog", "chronograph", "leather", "classic", "formal", "dress watch"],
          },
        },
        {
          name: "PulseFit Tracker Band",
          description: "Sleek all-day activity tracker with continuous SpO2, step tracking, and notification alerts.",
          pricePaise: 199900,
          metadata: {
            imageUrl: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&auto=format&fit=crop&q=80",
            category: "Wearables",
            originalPricePaise: 299900,
            discountPercent: 33,
            rating: 4.6,
            reviewsCount: 290,
            capacity: "14-day battery",
            weight: "0.02kg",
            feature: "SpO2 & Sleep monitor",
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
          metadata: {
            imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
            category: "Footwear",
            originalPricePaise: 629900,
            discountPercent: 28,
            rating: 4.8,
            reviewsCount: 650,
            capacity: "All day comfort",
            weight: "0.3kg",
            feature: "Memory foam insole",
            keywords: ["sneakers", "shoes", "kicks", "footwear", "running", "casual", "red sneaker", "comfort"],
          },
        },
        {
          name: "TrailGrip Hiking Shoes",
          description: "Waterproof low-cut trail shoe with Vibram rubber traction for rocky mountain paths.",
          pricePaise: 599900,
          metadata: {
            imageUrl: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&auto=format&fit=crop&q=80",
            category: "Footwear",
            originalPricePaise: 799900,
            discountPercent: 25,
            rating: 4.9,
            reviewsCount: 230,
            capacity: "Traction grip",
            weight: "0.45kg",
            feature: "Waterproof membrane",
            keywords: ["shoes", "hiking shoes", "trail", "outdoor", "trekking shoes", "waterproof shoes", "footwear"],
          },
        },
        {
          name: "Urban Runner Velocity",
          description: "Featherweight marathon and road running shoe engineered with carbon energy plate.",
          pricePaise: 379900,
          metadata: {
            imageUrl: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=80",
            category: "Footwear",
            originalPricePaise: 519900,
            discountPercent: 27,
            rating: 4.7,
            reviewsCount: 195,
            capacity: "High energy return",
            weight: "0.22kg",
            feature: "Carbon plate",
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
          metadata: {
            imageUrl: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80",
            category: "Tech",
            originalPricePaise: 359900,
            discountPercent: 30,
            rating: 4.8,
            reviewsCount: 310,
            capacity: "15W fast charge",
            weight: "0.15kg",
            feature: "Foldable travel design",
            keywords: ["charger", "wireless charger", "travel charger", "tech", "gadgets", "usb-c", "magnetic"],
          },
        },
        {
          name: "Leather Laptop Sleeve 14-inch",
          description: "Water-resistant padded laptop case with magnetic snap closure and soft microfiber lining.",
          pricePaise: 189900,
          metadata: {
            imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80",
            category: "Tech",
            originalPricePaise: 279900,
            discountPercent: 32,
            rating: 4.9,
            reviewsCount: 175,
            capacity: "Fits up to 14.2\"",
            weight: "0.2kg",
            feature: "Microfiber lining",
            keywords: ["laptop sleeve", "laptop case", "leather", "cover", "work", "tech accessory"],
          },
        },
        {
          name: "Tech Cable Portfolio Organizer",
          description: "Zippered accessory pouch with elastic loops for cables, chargers, hard drives, and adapters.",
          pricePaise: 129900,
          metadata: {
            imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80",
            category: "Tech",
            originalPricePaise: 189900,
            discountPercent: 31,
            rating: 4.7,
            reviewsCount: 220,
            capacity: "Multi-compartment",
            weight: "0.18kg",
            feature: "Splash-proof canvas",
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
          metadata: productData.metadata,
          active: true,
        },
        create: {
          id: productId,
          merchantId: merchant.id,
          name: productData.name,
          description: productData.description,
          pricePaise: productData.pricePaise,
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
