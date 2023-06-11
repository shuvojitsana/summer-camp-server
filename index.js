const express = require('express');
const app = express();
var jwt = require('jsonwebtoken');
require('dotenv').config();
const cors = require('cors');
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY)
const port = process.env.port || 5000;


// middle were
app.use(cors());
app.use(express.json());



const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' })
  }

  // bearer token
  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }

    req.decoded = decoded;
    next();
  })
}



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.m8fciuv.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const usersCollection = client.db("summerCamp").collection("users");
    const allClassesCollection = client.db("summerCamp").collection("allClasses");
    const instractorsCollection = client.db("summerCamp").collection("instractors");
    const classesCollection = client.db("summerCamp").collection("classes");

    // jwt 
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '2h' })

      res.send({ token })
    });


    // warning: verifyJwt
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user?.role !== 'admin') {
        return res.status(403).send({ error: true, message: 'forbidden message' })
      }
      next();
    }



    // usersCollection 
    app.get('/users', verifyJWT, verifyAdmin, async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    })


    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user?.email };
      const existingUser = await usersCollection.findOne(query);
      console.log('existingUser', existingUser)
      if (existingUser) {
        return res.send({ message: 'user already exist' })
      }

      const result = await usersCollection.insertOne(user);
      res.send(result);
    });


    app.get('/users/admin/:email', verifyJWT,  async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email != email) {
        res.send({ admin: false });
      }
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const result = { admin: user?.role === 'admin' };
      res.send(result);
    })


    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          role: 'admin'
        },
        // $set: {
        //   role : 'instructor'
        // }
      }
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    })

    app.delete('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    })


    // instractors collection
    app.get('/instractors', async (req, res) => {
      const result = await instractorsCollection.find().toArray();
      res.send(result);
    })



    // allClasses collection
    app.get('/allClasses', async (req, res) => {
      const result = await allClassesCollection.find().toArray();
      res.send(result);
    })


    // classes collection
    app.get('/classes', verifyJWT, async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([]);
      };

      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res.status(403).send({ error: true, message: 'verify jwt access' })
      }

      const query = { email: email };
      const result = await classesCollection.find(query).toArray();
      res.send(result);
    })

    app.post('/classes', async (req, res) => {
      const item = req.body;
      console.log(item);
      const result = await classesCollection.insertOne(item);
      res.send(result);
    })

    app.delete('/classes/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await classesCollection.deleteOne(query);
      res.send(result);
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('summer camp school is running')
})

app.listen(port, () => {
  console.log(`summer camp school is setting on a port: ${port}`)
})
