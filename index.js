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



function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'UnAuthorized access' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' })
    }
    req.decoded = decoded;
    next();
  });
}


async function run(){
    try{
        await client.connect()
        const productCollection = client.db('computer_mart').collection('products');
        const reviewCollection = client.db('computer_mart').collection('reviews');
        const bookingCollection = client.db('computer_mart').collection('bookings');
        const userCollection = client.db('computer_mart').collection('users');
        
        const verifyAdmin = async (req, res, next) => {
          const requester = req.decoded.email;
          const requesterAccount = await userCollection.findOne({ email: requester });
          if (requesterAccount.role === 'admin') {
            next();
          }
          else {
            res.status(403).send({ message: 'forbidden' });
          }
        }





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
      app.get('/booking' , verifyJWT, async (req , res) => {
        const customer = req.query.customer;
        const decodedEmail = req.decoded.email;

        if(customer === decodedEmail){

          const query = {customer : customer};
        const booking = await bookingCollection.find(query).toArray();
       
       return res.send(booking);
        }
        else{
          return res.status(403).send({message : 'forbidden access'})
        }

      })

      app.get('/booking/:id' , verifyJWT , async (req, res ) =>{
        const id = req.params.id;
        const query = {_id: ObjectId(id)};
        const booking = await bookingCollection.findOne(query);
        res.send(booking); 
      })

      app.get('/admin/:email' , async(req, res )=>{
       
       const email = req.params.email;
       const user = await userCollection.findOne({email : email});
       const isAdmin = user.role === 'admin' ;
       res.send({admin: isAdmin});




      })




      app.put('/user/admin/:email' , verifyJWT, verifyAdmin, async(req ,res ) => {
        const email = req.params.email;
       const filter = {email: email}
        const updateDoc ={
          $set: {role:'admin'},
        };
        const result =await userCollection.updateOne(filter, updateDoc);
       res.send(result );
        
        
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