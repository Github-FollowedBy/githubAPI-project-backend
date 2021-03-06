const express = require("express");
const app = express();
const port = 8080;
const cors = require("cors");
require("dotenv").config();
const fetchAPIData = require("./Routes/fetchAPIData");

app.use(
  /*Cross origin- this will basically take in the request only from the mentioned url, 
  else will reject it
  */
  cors({
    credentials: true,
    origin: process.env.FRONTEND_URL,
  })
);

app.set("trust proxy", 1);

app.use("/", fetchAPIData);

app.listen(process.env.PORT || port, () =>
  console.log(`App listening on port ${port}!`)
);

module.exports = app;
