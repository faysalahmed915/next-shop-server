// ======================
//  Import Dependencies
// ======================
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion } = require("mongodb");

// ======================
//  Load .env variables
// ======================
dotenv.config();
const port = process.env.PORT || 5000;

// ======================
//  Express App
// ======================
const app = express();
app.use(express.json());
app.use(cors());

// ======================
//  MongoDB Connection
// ======================
if (!process.env.DB_NAME) {
  throw new Error("❌ DB_NAME is not set in environment variables");
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cvrlul4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

let client;
let db;
let productsCollection;

async function connectDB() {
  if (!client) {
    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
    await client.connect();
    db = client.db(process.env.DB_NAME);
    productsCollection = db.collection("products");
    console.log("✅ Connected to MongoDB:", process.env.DB_NAME);
  }
}

// ======================
//  Routes
// ======================

// Root route
app.get("/", (req, res) => {
  res.send("🚀 NextShop API is running!");
});

// Health check / Ping
app.get("/ping", async (req, res) => {
  try {
    await connectDB();
    await db.command({ ping: 1 });
    res.send("✅ Pinged MongoDB successfully!");
  } catch (err) {
    res.status(500).send("❌ MongoDB connection failed");
  }
});

// GET /products → fetch all products
app.get("/products", async (req, res) => {
  try {
    await connectDB();
    const products = await productsCollection.find({}).toArray();
    res.status(200).json(products);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

// POST /products → add new product (using image URL instead of multer)
app.post("/products", async (req, res) => {
  try {
    await connectDB();
    const { name, price, description, image } = req.body;

    // ✅ Validation
    if (!name || !price) {
      return res.status(400).json({ message: "Name and price are required" });
    }

    const newProduct = {
      name,
      price: parseFloat(price),
      description: description || "",
      image: image || null, // Save image URL (better for Vercel)
      createdAt: new Date(),
    };

    const result = await productsCollection.insertOne(newProduct);

    res.status(201).json({
      message: "✅ Product added successfully",
      productId: result.insertedId,
      product: newProduct,
    });
  } catch (err) {
    console.error("Error adding product:", err);
    res.status(500).json({ message: "Failed to add product" });
  }
});

// ======================
//  Start Server
// ======================
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
