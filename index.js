const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
const app = express();


app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.q9vhr.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run(){
    try{
        await client.connect()
        const productCollection = client.db('computer_mart').collection('products');
        const reviewCollection = client.db('computer_mart').collection('reviews');
        const bookingCollection = client.db('computer_mart').collection('bookings');
        const userCollection = client.db('computer_mart').collection('users');
        
        app.get('/review', async(req,res) =>{
         const query = {};
        const cursor = reviewCollection.find(query);
        const products = await cursor.toArray();
        res.send(products);
        });
        app.get('/product', async(req,res) =>{
         const query = {};
        const cursor = productCollection.find(query);
        const products = await cursor.toArray();
        res.send(products);
        });
        app.get('/product/:id', async(req,res)=> {
          const id = req.params.id;
          const query = {_id:ObjectId(id)};
          const product = await productCollection.findOne(query);
          res.send(product);
      })
    
      app.post('/booking' , async(req ,res ) => {
        const booking = req.body;
        const result =await bookingCollection.insertOne(booking);
        res.send(result);
      })
      app.get('/booking' , async (req , res) => {
        const customer = req.query.customer;
        const query = {customer : customer};
        const booking = await bookingCollection.find(query).toArray();
       
        res.send(booking);

      })

      app.get('/admin/:email' , async(req, res )=>{
       
       const email = req.params.email;
       const user = await userCollection.findOne({email : email});
       const isAdmin = user.role === 'admin' ;
       res.send({admin: isAdmin});




      })




      app.put('/user/admin/:email' , async(req ,res ) => {
        const email = req.params.email;
        // const requester = req.decoded.email;
        const requesterAccount = await userCollection.findOne({email: email});
        if(requesterAccount.role === 'admin') {
          const filter = {email: email}
        const updateDoc ={
          $set: {role:'admin'},
        };
        const result =await userCollection.updateOne(filter, updateDoc);
       res.send(result );
        }
        else {
          res.status(403).send({message : 'forbidden'})
        }
        
      });
      app.put('/user/:email' , async(req ,res ) => {
        const email = req.params.email;
        const user = req.body;
        const filter = {email: email}
        const options ={upsert: true}
        const updateDoc ={
          $set: user,
        };
        const result =await userCollection.updateOne(filter, updateDoc, options);
        const token =jwt.sign({email: email}, process.env.ACCESS_TOKEN_SECRET ,  { expiresIn: '1h' })
        res.send({result , token});
      });
      app.get('/user', async(req,res)=>{
        const users = await userCollection.find().toArray();
        res.send(users);
      })
      app.get('/bookings', async(req,res)=>{
        const users = await bookingCollection.find().toArray();
        res.send(users);
      })
    }

  finally{

  }

} 
run().catch(console.dir);






 
app.get('/' , (req, res )=>{
  res.send('running broooo')
});


app.listen(port , ()=>{
    console.log('iam here' , port);
})