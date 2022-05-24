const { MongoClient, ServerApiVersion } = require('mongodb');

const express = require('express');
const cors = require('cors');
require('dotenv').config();
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