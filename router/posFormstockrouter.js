const express = require("express");
const stockPosformCtrl = require("../controller/stockPosformCtrl");


module.exports = (app) => {
  const Router = express.Router();

  Router.route('/').post(stockPosformCtrl.createOrdersAndStocks)
  Router.route('/create').post(stockPosformCtrl.StockAndOrder)

  app.use("/api/v1/posformstock", Router);
};