import bcrypt from 'bcryptjs';

import {  Role, ProductStatus } from '../generated/prisma/client';

import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🌱 Starting database seed...");

  // 1. Admin User
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "SuperSecret123!";
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      role: Role.ADMIN,
    },
    create: {
      email: adminEmail,
      name: "System Admin",
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  console.log(`✅ Admin User: ${admin.email}`);

  // 2. Categories
  const ensureCategory = async (name: string, parentId?: string) => {
    const existing = await prisma.category.findFirst({ where: { name } });
    if (existing) {
      return existing;
    }
    return prisma.category.create({
      data: { name, parentId },
    });
  };

  const electronics = await ensureCategory("Electronics");
  const clothing = await ensureCategory("Clothing");

  const smartphones = await ensureCategory("Smartphones", electronics.id);
  const laptops = await ensureCategory("Laptops", electronics.id);
  const mensWear = await ensureCategory("Men's Wear", clothing.id);

  console.log(`✅ Categories seeded (Hierarchy created)`);

  // 3. Products
  const products = [
    {
      name: "iPhone 15 Pro",
      description: "Titanium design, A17 Pro chip.",
      sku: "PHONE-001",
      price: 999.0,
      stock: 50,
      categoryId: smartphones.id,
    },
    {
      name: "MacBook Pro M3",
      description: "Space Black, 14-inch.",
      sku: "LAPTOP-001",
      price: 1999.0,
      stock: 20,
      categoryId: laptops.id,
    },
    {
      name: "Classic T-Shirt",
      description: "100% Cotton, Black.",
      sku: "SHIRT-001",
      price: 29.99,
      stock: 100,
      categoryId: mensWear.id,
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        categoryId: p.categoryId,
        price: p.price,
      },
      create: {
        name: p.name,
        description: p.description,
        sku: p.sku,
        price: p.price,
        stock: p.stock,
        categoryId: p.categoryId,
        status: ProductStatus.ACTIVE,
      },
    });
  }

  console.log(`✅ Products seeded: ${products.length} items`);
  console.log("🚀 Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
    await prisma.$disconnect();
  });