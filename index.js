const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors');
const port = process.env.port || 5000;


// middle were
app.use(cors());
app.use(express.json());



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

    const allClassesCollection = client.db("summerCamp").collection("allClasses");
    const instractorsCollection = client.db("summerCamp").collection("instractors");
    const classesCollection = client.db("summerCamp").collection("classes");


    // instractors collection
    app.get('/instractors',  async(req, res) =>{
        const result = await instractorsCollection.find().toArray();
        res.send(result);
    })



    // allClasses collection
    app.get('/allClasses',  async(req, res) =>{
        const result = await allClassesCollection.find().toArray();
        res.send(result);
    })


    // classes collection
    app.get('/classes', async(req, res)=>{
      const email = req.query.email;
      if(!email){
        res.send([]);
      }
      const query =  { email: email};
      const result = await classesCollection.find(query).toArray();
      res.send(result);
    })

    app.post('/classes', async(req, res) =>{
      const item = req.body;
      console.log(item);
      const result = await classesCollection.insertOne(item);
      res.send(result);
    })

    app.delete('/classes/:id', async(req, res) =>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
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



app.get('/', (req, res) =>{
    res.send('summer camp school is running')
})

app.listen(port, () =>{
    console.log(`summer camp school is setting on a port: ${port}`)
})
