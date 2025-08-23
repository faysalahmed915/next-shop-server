// Express app
const express = require('express');
const app = express();
const cors = require('cors');

// Load environment variables
require('dotenv').config()


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000


app.use(express.json())
app.use(cors())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cvrlul4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});



let db

async function run() {
    try {
        await client.connect()
        db = client.db(DB_NAME)
        console.log("Connected to MongoDB:", DB_NAME)



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
    } catch (err) {
        console.error("MongoDB connection error:", err)
    }
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("NextShop API is running 🚀");
});


// Start server
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
