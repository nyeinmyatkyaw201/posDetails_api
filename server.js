const express = require('express');
const errorHandler = require('./middlewares/errorHandle')
const app = express();
const cors = require('cors');
const db = require('./model/index');
app.use(errorHandler);
const Posform = db.postform;

var corsOption = {
    origin: "*",
  };
  db.sequalize
    .sync()
    .then(() => {
      console.log("Synced db.");
      // for(let i=1 ; i < 25;i++){
      //   const postForm = {
      //     order_id : i,
      //     counter_no : i,
      //     casher_name :  `Nang Kyawt ${i}`
      //   }
      //   await Posform.create(postForm);
      // }
    })
    .catch((err) => {
      console.log("Failed to sync db: " + err.message);
    });
  
  app.use(cors(corsOption));

app.use(express.json());


app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.json({ message: "Welcome to nodejs application." });
  });
require("./router/posformrouter")(app)
require("./router/stockrouter")(app)
require("./router/posFormstockrouter")(app)

app.listen(3000,()=>{
    console.log("app is listening on port 3000");
    
})