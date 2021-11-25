const express = require('express');
const { MongoClient } = require("mongodb");
const cors = require('cors');
const fileupload = require('express-fileupload');
const app = express();
require('dotenv').config();
const  ObjectId = require('mongodb').ObjectId;
const port = process.env.PORT || 3010
app.use(cors());
app.use(express.json());
app.use(fileupload());

// strip key//
const stripe = require("stripe")(process.env. STRIPE_SECREET_KEY);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.he93e.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
async function run(){
  try {
    await client.connect();
    const database = client.db('doctor_portal');
    const AppointmentData = database.collection('appointment');
    const userDataCollection = database.collection('users');
    const doctorDataCollection = database.collection('doctors');
    // console.log('database successfully coneted';
   //POST for appointmentdata ---Method---------------------API
   app.post('/appointment', async(req,res)=>{
     const appointment = req.body;
     const result = await AppointmentData.insertOne(appointment);
     console.log(result)
   })

  //get Metod for appointment ---------------------API
  app.get('/appointment', async(req, res)=>{
    const email = req.query.email;
    const date = req.query.date;
    
    const query = {email:email,date:date}
     const cursor = AppointmentData.find(query);
    const appointments = await cursor.toArray();
    res.json(appointments);
  })
  // update appointment for ----------------------------adding payment
  app.put('/appointment/:id', async (req, res)=>{
    const id = req.params.id;
    const payment = req.body;
    const filter = {_id:ObjectId(id)};
    const updateDoc = {
      $set:{payment:payment}
    };
    const result = await AppointmentData.updateOne(filter,updateDoc)
    res.json(result)
    console.log(result);
  })
  //GET method for taking admin user--------------------------get admin
  app.get('/users/:email', async(req, res) =>{
    const email = req.params.email;
    const query = { email: email};
    const user = await userDataCollection.findOne(query)
    let isAdmin = false;
    if(user?.role == 'admin'){
      isAdmin = true
    }
    res.json({admin: isAdmin})
  })
  //POST Method for save user data---------------------------------user
  app.post('/users', async(req, body)=>{
    const users = req.body;
    const result = await userDataCollection.insertOne(users);
    console.log(result)
  })
  //update user----------------------------------------------------upset
  app.put('/users', async(req, res)=>{
    const user =req.body;
    const filter = {email:user.email} ;
    const options = {upsert: true};
    const updateDoc = {$set: user}
    const result  =await userDataCollection.updateOne(filter,updateDoc,options)
    res.json(result)
  })

  //update method for admin----------------admin api
  app.put('/user/admin', async(req, res)=>{
    const user = req.body;
    console.log(user)
    const filter = {email: user.email};
    const updateDoc = {$set:{role:'admin'}};
    const result = await userDataCollection.updateOne(filter, updateDoc);
    res.json(result);
  })
  // get user appointment  by id----------------------get quary appointment
 app.get('/appointment/:id', async (req, res)=>{
   const id = req.params.id;
   const quary = {_id:ObjectId(id)};
   const result = await AppointmentData.findOne(quary);
   res.send(result)
 })

 //payment implement ------------------------------payment
 app.post("/create-payment-intent", async (req, res) => {
  const paymentInfo = req.body;
  const amount = paymentInfo.price*100;
  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: "USD",
    payment_method_types: [
      "card" 
    ],
  });
  res.send({
    clientSecret: paymentIntent.client_secret,
  });

});

//doctor daata collection ---------------------add doctor
app.post('/doctors', async (req, res)=>{
  const name= req.body.name;
  const email = req.body.email;
  const avater = req.files.image;
  const avaterData = avater.data;
  const encodeAveter = avaterData.toString('base64');
  const imageBuffer = Buffer.from(encodeAveter, 'base64')
  const doctor={
    name,
    email,
    image:imageBuffer
  }
  const result = await doctorDataCollection.insertOne(doctor)
  res.json(result);
  console.log(result);
})
//doctor get-----------------------get doctosr
app.get('/doctors', async(req, res)=>{
  const cursor = doctorDataCollection.find({});
  const doctors = await cursor.toArray();
  res.json(doctors)
})
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/' , (req, res)=>{
  res.json('doctor portal server is running');
})

app.listen(port, ()=> {
  console.log('doctor server is running and listing from',port)
})