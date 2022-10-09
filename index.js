require('dotenv').config();

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const express = require('express');
const cors = require('cors');

const jwt = require('jsonwebtoken');
const stripe = require('stripe')('sk_test_51L3zoGFafvgGReSnALBrXYIsLBi0Suv6v2o9Er0LXbWcT1zkK9ZNswIyz6OO7JjYDRg9t5D2ddRrvIfXOMNpHBOo00MeEeyUA6');




const port = process.env.PORT || 5000;

const app = express();

app.use(cors({origin: ['http://localhost:3000' , 'https://computer-mart-fb654.web.app']}));

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
        const paymentCollection = client.db('computer_mart').collection('payments');
        const profileCollection = client.db('computer_mart').collection('profiles');
        
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


       app.post('/create-payment-intent', async (req, res)=>{
         const product = req.body;
         const price = product.price;
         const amount = price*100;
         const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency:'usd',
          payment_method_types: ['card']
          
        });

        res.send({clientSecret: paymentIntent.client_secret})

       })


        app.get('/review', async(req,res) =>{
         const query = {};
        const cursor = reviewCollection.find(query);
        const products = await cursor.toArray();
        res.send(products);
        });

        app.post('/review' , async(req ,res ) => {
          const review = req.body;
          const result =await reviewCollection.insertOne(review);
          res.send(result);
        })


        app.get('/product', async(req,res) =>{
         const query = {};
        const cursor = productCollection.find(query);
        const products = await cursor.toArray();
        res.send(products);
        });


        app.post('/product' , async(req ,res ) => {
          const product = req.body;
          const result =await productCollection.insertOne(product);
          res.send(result);
        })

        app.put('/profile/:email' , async(req ,res ) => {
          const email = req.params.email;
        const user = req.body;
        const filter = {email: email}
        const options ={upsert: true}
        const updateDoc ={
          $set: user,
        };
        const result =await profileCollection.updateOne(filter, updateDoc, options);
        res.send(result)
        })

        // get profile data
        app.get('/profile/:email', async(req, res) =>{
          const email = req.params.email;
          const query = {email: email};
          const result = await profileCollection.findOne(query);
          res.send(result);
        })
       
        app.get('/product/:id', async(req,res)=> {
          const id = req.params.id;
          const query = {_id:ObjectId(id)};
          const product = await productCollection.findOne(query);
          res.send(product);
      })
      
      // delete api

      app.delete('/product/:id' , async(req , res) =>{
        const id = req.params.id;
        const query = {_id: ObjectId(id)};
        const result = await productCollection.deleteOne(query);
        res.send(result);
        
      })
    
      app.post('/booking' , async(req ,res ) => {
        const booking = req.body;
        const result =await bookingCollection.insertOne(booking);
        res.send(result);
      })
      app.get('/booking' ,  async (req , res) => {
        const customer = req.query.customer;
        const query = {customer : customer};
        const booking = await bookingCollection.find(query).toArray();
        res.send(booking);
      

      })

      // delete myOrder
   

      app.get('/booking/:id' , verifyJWT , async (req, res ) =>{
        const id = req.params.id;
        const query = {_id: ObjectId(id)};
        const booking = await bookingCollection.findOne(query);
        res.send(booking); 
      })

      app.put('/booking/:id' , verifyJWT , async (req , res)=>{
          const id = req.params.id;
          const payment = req.body;
          const filter = {_id: ObjectId(id)};
          const updateDoc ={
            $set: {
               paid: true,
               transactionId: payment.transactionId
            }

          };
          // 


          const result = await paymentCollection.insertOne(payment);
          const updateBooking = await bookingCollection.updateOne(filter , updateDoc);
          res.send(updateDoc)

      })

      app.get('/admin/:email' ,  async(req, res )=>{
       
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
      // delete booking
      app.delete('/bookings/:id', async(req,res) => {
         const id = req.params.id;
        const query = {_id:ObjectId(id)};
        const booking = await bookingCollection.deleteOne(query);
        res.send(booking);

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