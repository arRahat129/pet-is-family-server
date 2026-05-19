const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
dotenv.config();

const uri = process.env.MONGODB_URI;

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {

        await client.connect();

        const db = client.db('pet-is-family');
        const petCollection = db.collection('pets');
        const adoptionCollection = db.collection('adoptions');

        app.get('/pet', async (req, res) => {
            const result = await petCollection.find().toArray();
            res.json(result);
        })

        app.post('/pet', async (req, res) => {
            const petData = req.body;
            console.log(petData);
            const result = await petCollection.insertOne(petData);
            res.json(result);
        })

        app.get('/pet/:petId', async (req, res) => {
            // console.log(req);
            const { petId } = req.params;

            const result = await petCollection.findOne({ _id: new ObjectId(petId) });

            res.json(result);
        })

        app.get('/adoption/adopter/:userId', async (req, res) => {
            const result = await adoptionCollection.find({
                adopterId: req.params.userId
            }).toArray();

            res.json(result);
        });

        app.post('/adoption/', async (req, res) => {
            const adoptionData = req.body;
            const result = await adoptionCollection.insertOne(adoptionData);
            res.json(result);
        });

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send("Pet Is Family Website Server is Running...");
})

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
})