// Load environment variables
require('dotenv').config()

const express = require("express")
const cors = require("cors")
const multer = require("multer")
const fs = require("fs")
const path = require("path")
const { MongoClient } = require("mongodb")

// Config
const PORT = process.env.PORT || 5000
const MONGO_URI = process.env.MONGO_URI
const DB_NAME = "NextShop" // ← updated database name

// Express app
const app = express()
app.use(cors())
app.use(express.json())
app.use("/uploads", express.static("uploads"))

// Ensure uploads folder exists
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads")

// Multer setup for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + path.extname(file.originalname)
        cb(null, file.fieldname + "-" + uniqueSuffix)
    }
})
const upload = multer({ storage })

// MongoDB client (persistent connection)
const client = new MongoClient(MONGO_URI)
let db

async function connectDB() {
    try {
        await client.connect()
        db = client.db(DB_NAME)
        console.log("Connected to MongoDB:", DB_NAME)
    } catch (err) {
        console.error("MongoDB connection error:", err)
    }
}
connectDB()

// Routes

// POST /products → add product
app.post("/products", upload.single("image"), async (req, res) => {
    try {
        const collection = db.collection("products") // collection name remains "products"
        const { name, price, description } = req.body
        const image = req.file ? req.file.filename : null

        const newProduct = { name, price: parseFloat(price), description, image }
        await collection.insertOne(newProduct)

        res.status(201).json({ message: "Product added successfully", product: newProduct })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Failed to add product" })
    }
})

// GET /products → list all products
app.get("/products", async (req, res) => {
    try {
        const collection = db.collection("products")
        const products = await collection.find({}).toArray()
        res.status(200).json(products)
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Failed to fetch products" })
    }
})

// GET /ping → test connection
app.get("/ping", async (req, res) => {
    try {
        await db.command({ ping: 1 })
        res.send("Pinged MongoDB successfully!")
    } catch (err) {
        res.status(500).send("MongoDB connection failed")
    }
})


app.get("/", (req, res) => {
  res.send("NextShop API is running 🚀");
});


// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))