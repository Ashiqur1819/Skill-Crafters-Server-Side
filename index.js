const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "https://skill-crafters-78d6e.web.app"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;

  if (!token) {
    return res.status(401).send({ message: "Unauthorized Access!" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
    if (error) {
      return res.status(401).send({ message: "Unauthorized Access!" });
    }
    req.user = decoded;
    next();
  });
};

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
    const serviceCollection = client
      .db("SkillCraftersDB")
      .collection("services");
    const bookedServiceCollection = client
      .db("SkillCraftersDB")
      .collection("bookedServices");

    // Auth related apis inside mongodb
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "1h" });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    app.post("/logout", (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: false,
        })
        .send({ success: true });
    });

    // ================ serviceCollection api's ===================

    // get all services
    app.get("/services", async (req, res) => {
      const cursor = serviceCollection.find().limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    // get all services by query
    app.get("/all-services", async (req, res) => {
      const search = req.query.search;
      let query = {
        serviceName: { $regex: `${search}`, $options: "i" },
      };
      const cursor = serviceCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // get single service
    app.get("/services/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await serviceCollection.findOne(query);
      res.send(result);
    });

    // get all services posted by a specific user
    app.get("/service/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { providerEmail: email };
      const result = await serviceCollection.find(query).toArray();
      res.send(result);
    });

    // Post single service
    app.post("/services", verifyToken, async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service);
      res.send(result);
    });

    // Update service
    app.put("/services/:id", verifyToken, async (req, res) => {
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
    app.delete("/services/:id", verifyToken, async (req, res) => {
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
    app.get("/booked_services/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      if (req.user.email !== req.params.email) {
        return res.status(403).send({ message: "Forbidden Access!" });
      }
      const result = await bookedServiceCollection.find(query).toArray();
      res.send(result);
    });

    // Post single bookedservice
    app.post("/booked_services", verifyToken, async (req, res) => {
      const service = req.body;
      const query = {
        userEmail: service.userEmail,
        serviceId: service.serviceId,
      };
      const alreadyExist = await bookedServiceCollection.findOne(query);
      if (alreadyExist)
        return res.status(400).send("You have already booked this service!");
      const result = await bookedServiceCollection.insertOne(service);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("The server running successfully!");
});

app.listen(port);
