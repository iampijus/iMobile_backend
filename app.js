const dotenv = require("dotenv");
const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const cors=require('cors');

dotenv.config({ path: "./config.env" });
require("./db/connection");

app.use(express.json()); 
app.use(cookieParser());
// cors for requesting from 5000 to 3000 port
app.use(cors())
app.use(express.urlencoded({extended:true}))
// we link the router files to make our route easy
app.use(require("./router/auth"));

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}...`);
});
