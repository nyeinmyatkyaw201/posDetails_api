const express = require("express");
const stockCtrl = require("../controller/stockCtrl");


module.exports = (app) => {
  const Router = express.Router();


  Router.route("/").post(stockCtrl.save).get(stockCtrl.findAll).delete(stockCtrl.deleteAll);
  Router.route('/:id').get(stockCtrl.getStocks).delete(stockCtrl.delete)
  Router.route('/:id').patch(stockCtrl.update);
  Router.route("/getDelete/:id").delete(stockCtrl.getandDelete)
  Router.route("/savefromexcel").post(stockCtrl.stockCreatebulk)
  Router.route('/orderstock/:id').delete(stockCtrl.deleteOrderStock).get(stockCtrl.getOrderStock)
  
  app.use("/api/v1/stock", Router);
};
