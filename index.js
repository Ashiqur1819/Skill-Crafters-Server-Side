const express = require('express');
const cors = require('cors');
require("dotenv").config();
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zt90y.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const serviceCollection = client
      .db("SkillCraftersDB")
      .collection("services");
    const bookedServiceCollection = client
      .db("SkillCraftersDB")
      .collection("bookedServices");

    // ================ serviceCollection api's ===================
    // get all services
    app.get("/services", async (req, res) => {
      const search = req.query.search;
      let query = {
        serviceName: { $regex: search, $options: "i" },
      };
      const cursor = serviceCollection.find(query).limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    // app.get("all-services", async(req, res) => {
    //   const search = req.query.search;
    //   let query = {title: {
    //     $regex: search, $options: "i"
    //   }}
    //   const result = await serviceCollection.find(query).toArray()
    //   res.send(result)

    // })

    // get single service
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await serviceCollection.findOne(query);
      res.send(result);
    });

    // get all services posted by a specific user
    app.get("/service/:email", async (req, res) => {
      const email = req.params.email;
      const query = { providerEmail: email };
      const result = await serviceCollection.find(query).toArray();
      res.send(result);
    });

    // Post single service
    app.post("/services", async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service);
      res.send(result);
    });

    // Update service
    app.put("/services/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const service = req.body;
      const updatedService = {
        $set: {
          serviceImage: service.serviceImage,
          serviceName: service.serviceName,
          price: service.price,
          serviceArea: service.serviceArea,
          description: service.description,
        },
      };
      const result = await serviceCollection.updateOne(
        filter,
        updatedService,
        options
      );
      res.send(result);
    });

    // Delete service
    app.delete("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await serviceCollection.deleteOne(query);
      res.send(result);
    });

    //======================== bookedServiceCollection api's =======================
    // get all bookedservices
    app.get("/booked_services", async (req, res) => {
      const cursor = bookedServiceCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // get single bookedservice
    app.get("/booked_services/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const result = await bookedServiceCollection.find(query).toArray();
      res.send(result);
    });

    // Post single bookedservice
    app.post("/booked_services", async (req, res) => {
      const service = req.body;
      const query = { userEmail: service.userEmail, serviceId: service.serviceId };
      const alreadyExist = await bookedServiceCollection.findOne(query);
      if (alreadyExist)
        return res
          .status(400)
          .send("You have already booked this service!");
      const result = await bookedServiceCollection.insertOne(service);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get("/", (req, res) => {
    res.send("The server running successfully!");
});

app.listen(port, () => {
    // console.log("The server running successfully on port:", port)
})