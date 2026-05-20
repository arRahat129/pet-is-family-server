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

        app.patch('/pet/:petId', async (req, res) => {
            const { petId } = req.params;
            const updatedPetData = req.body;

            const result = await petCollection.updateOne(
                { _id: new ObjectId(petId) },
                { $set: updatedPetData }
            );

            res.json(result);
        });

        app.get('/pet/owner/:userId', async (req, res) => {
            const { userId } = req.params;
            const result = await petCollection.find({ userId: userId }).toArray();
            res.json(result);
        })

        app.get('/adoption', async (req, res) => {
            const result = await adoptionCollection.find().toArray();
            res.json(result);
        });

        app.get('/adoption/adopter/:userId', async (req, res) => {
            const { userId } = req.params;
            const result = await adoptionCollection.find({ adopterId: userId }).toArray();
            res.json(result);
        })

        app.get('/adoption/pet/:petId', async (req, res) => {
            const { petId } = req.params;
            const result = await adoptionCollection.find({ petId: petId }).toArray();
            res.json(result);
        })


        app.post('/adoption', async (req, res) => {
            const adoptionData = req.body;

            //
            const pet = await petCollection.findOne({
                _id: new ObjectId(adoptionData.petId)
            });

            if (!pet) {
                return res.status(404).json({ message: "Pet Not Found" })
            }

            if (pet.adoptionStatus === "adopted") {
                return res.status(400).json({
                    message: "This pet is already adopted"
                });
            }
            //

            const result = await adoptionCollection.insertOne(adoptionData);
            res.json(result);
        });

        // Approve Request
        app.patch('/adoption/:id/approve', async (req, res) => {
            const { id } = req.params;

            const request = await adoptionCollection.findOne({
                _id: new ObjectId(id)
            });

            if (!request) {
                return res.status(404).json({ message: "Request not found" });
            }

            await adoptionCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: { status: "approved" } }
            );

            await adoptionCollection.updateMany(
                {
                    petId: request.petId,
                    _id: { $ne: new ObjectId(id) }
                },
                { $set: { status: "rejected" } }
            );

            await petCollection.updateOne(
                { _id: new ObjectId(request.petId) },
                { $set: { adoptionStatus: "adopted" } }
            );

            res.json({ success: true });
        });

        // Reject Request
        app.patch('/adoption/:id/reject', async (req, res) => {
            const { id } = req.params;

            await adoptionCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: { status: "rejected" } }
            );

            res.json({ success: true });
        });

        // Cancel
        app.patch('/adoption/:id/cancel', async (req, res) => {

            const { id } = req.params;

            const request = await adoptionCollection.findOne({
                _id: new ObjectId(id)
            });

            if (!request) {
                return res.status(404).json({
                    message: "Request not found"
                });
            }

            if (request.status === "approved") {
                return res.status(400).json({
                    message: "Cannot cancel approved request"
                });
            }

            const result = await adoptionCollection.updateOne(
                { _id: new ObjectId(id) },
                {
                    $set: {
                        status: "cancelled"
                    }
                }
            );

            res.json({
                success: true,
                result
            });
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