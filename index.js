import mongoose  from "mongoose";
import express from "express"
import bodyParser from "body-parser";
import cors from "cors";

import GLOBLES from "./config/constants.js";

import authRoute from "./module/v1/auth/api/authRoute.js"

const app = express();
app.use(express.json());
app.use(express.text());
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))

app.use("/api/v1/auth",authRoute)

mongoose.connect(GLOBLES.MONGO_URI).
then(()=>{
    console.log("mongoDB connected")
}).catch((error)=>{
    console.log("something went wrong");
})

app.listen(GLOBLES.PORT,()=>{
    console.log("server is running on port ",GLOBLES.PORT);
})