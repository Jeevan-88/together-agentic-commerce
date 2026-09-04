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
          description: "Lightweight everyday travel backpack with a 25L capacity.",
          pricePaise: 499900,
          metadata: {
            capacity: "25L",
            weight: "0.9kg",
            feature: "Cabin friendly",
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
          description: "Spacious travel backpack with a dedicated laptop sleeve.",
          pricePaise: 549900,
          metadata: {
            capacity: "28L",
            weight: "1.1kg",
            feature: "Laptop sleeve",
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
          description: "Compact lightweight backpack designed for everyday travel.",
          pricePaise: 439900,
          metadata: {
            capacity: "24L",
            weight: "0.7kg",
            feature: "Compact design",
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
      await prisma.product.upsert({
        where: {
          id: `${merchant.slug}-${productData.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")}`,
        },
        update: {
          name: productData.name,
          description: productData.description,
          pricePaise: productData.pricePaise,
          metadata: productData.metadata,
          active: true,
        },
        create: {
          id: `${merchant.slug}-${productData.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")}`,
          merchantId: merchant.id,
          name: productData.name,
          description: productData.description,
          pricePaise: productData.pricePaise,
          metadata: productData.metadata,
        },
      });
    }
  }

  console.log("Catalog seed completed.");
}

main()
  .catch((error) => {
    console.error("Catalog seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });