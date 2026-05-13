const mongoose = require("mongoose");
const slugify = require("slugify");

const connectDB = require("../DataBase/db");
const Category = require("../Models/Category");

const taxonomy = [
  {
    name: "Gents",
    sortOrder: 10,
    children: [
      {
        name: "Clothing",
        sortOrder: 10,
        children: [
          "T-Shirts",
          "Shirts",
          "Polo Shirts",
          "Hoodies & Sweatshirts",
          "Jackets & Coats",
          "Jeans",
          "Trousers",
          "Shorts",
          "Joggers",
          "Suits & Blazers",
          "Ethnic Wear",
          "Innerwear",
          "Sleepwear",
          "Sportswear",
          "Swimwear",
        ],
      },
      {
        name: "Footwear",
        sortOrder: 20,
        children: [
          "Sneakers",
          "Formal Shoes",
          "Casual Shoes",
          "Sandals",
          "Slippers",
          "Boots",
          "Sports Shoes",
          "Loafers",
        ],
      },
      {
        name: "Accessories",
        sortOrder: 30,
        children: [
          "Watches",
          "Wallets",
          "Belts",
          "Caps & Hats",
          "Sunglasses",
          "Bags & Backpacks",
          "Ties & Bow Ties",
          "Bracelets",
          "Rings",
          "Chains",
          "Perfumes",
        ],
      },
      {
        name: "Grooming",
        sortOrder: 40,
        children: ["Beard Care", "Hair Care", "Skin Care", "Shaving Products", "Perfumes & Deodorants"],
      },
    ],
  },
  {
    name: "Ladies",
    sortOrder: 20,
    children: [
      {
        name: "Clothing",
        sortOrder: 10,
        children: [
          "Dresses",
          "Tops & Blouses",
          "T-Shirts",
          "Shirts",
          "Hoodies & Sweatshirts",
          "Jackets & Coats",
          "Jeans",
          "Trousers & Leggings",
          "Skirts",
          "Shorts",
          "Jumpsuits",
          "Sarees",
          "Kurtis & Ethnic Wear",
          "Lingerie",
          "Nightwear",
          "Activewear",
          "Swimwear",
        ],
      },
      {
        name: "Footwear",
        sortOrder: 20,
        children: ["Heels", "Flats", "Sneakers", "Sandals", "Slippers", "Boots", "Wedges", "Sports Shoes"],
      },
      {
        name: "Accessories",
        sortOrder: 30,
        children: [
          "Handbags",
          "Watches",
          "Jewelry",
          "Sunglasses",
          "Scarves",
          "Hair Accessories",
          "Wallets",
          "Belts",
          "Makeup Bags",
          "Perfumes",
        ],
      },
      {
        name: "Beauty",
        sortOrder: 40,
        children: ["Makeup", "Skin Care", "Hair Care", "Nail Care", "Perfumes & Fragrances"],
      },
    ],
  },
  {
    name: "Unisex",
    sortOrder: 30,
    children: [
      {
        name: "Clothing",
        sortOrder: 10,
        children: [
          "Oversized T-Shirts",
          "Hoodies",
          "Sweatshirts",
          "Joggers",
          "Jackets",
          "Tracksuits",
          "Activewear",
          "Streetwear",
          "Co-ord Sets",
        ],
      },
      {
        name: "Footwear",
        sortOrder: 20,
        children: ["Sneakers", "Slides", "Sandals", "Sports Shoes"],
      },
      {
        name: "Accessories",
        sortOrder: 30,
        children: ["Caps", "Backpacks", "Watches", "Sunglasses", "Chains", "Bracelets", "Socks", "Phone Cases"],
      },
      {
        name: "Lifestyle",
        sortOrder: 40,
        children: ["Water Bottles", "Gym Accessories", "Tech Accessories", "Tote Bags"],
      },
    ],
  },
];

const createNode = async (node, parentCategory = null, parentSlug = null) => {
  const name = String(node.name).trim();
  const baseSlug = slugify(name, { lower: true, strict: true });
  const slug = parentSlug ? `${parentSlug}-${baseSlug}` : baseSlug;

  const existing = await Category.findOne({ slug });
  const payload = {
    name,
    slug,
    parentCategory,
    isActive: true,
    isFeatured: parentCategory === null,
    showOnHome: parentCategory === null,
    sortOrder: Number(node.sortOrder || 0),
    meta: {
      title: name,
      description: `${name} categories`,
      keywords: [name, ...(Array.isArray(node.children) ? node.children.map((child) => (typeof child === "string" ? child : child.name)) : [])],
    },
  };

  const document = existing ? await Category.findByIdAndUpdate(existing._id, payload, { new: true }) : await Category.create(payload);

  if (!Array.isArray(node.children) || node.children.length === 0) {
    return document;
  }

  for (let index = 0; index < node.children.length; index += 1) {
    const child = node.children[index];
    const childNode = typeof child === "string" ? { name: child, sortOrder: index + 1, children: [] } : { ...child, sortOrder: child.sortOrder ?? index + 1 };
    // eslint-disable-next-line no-await-in-loop
    await createNode(childNode, document._id, slug);
  }

  return document;
};

const seedCategoryTaxonomy = async () => {
  await connectDB();

  for (const root of taxonomy) {
    // eslint-disable-next-line no-await-in-loop
    await createNode(root, null, null);
  }

  await mongoose.connection.close();
  console.log("Category taxonomy seeded successfully");
};

if (require.main === module) {
  seedCategoryTaxonomy().catch(async (error) => {
    console.error("Failed to seed category taxonomy", error);
    await mongoose.connection.close().catch(() => {});
    process.exitCode = 1;
  });
}

module.exports = seedCategoryTaxonomy;