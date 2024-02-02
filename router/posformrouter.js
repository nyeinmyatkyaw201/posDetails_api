const express = require("express");
const postformCtrl = require("../controller/posformCtrl");


module.exports = (app) => {
    const Router = express.Router();
  
    Router.route('/').post(postformCtrl.save).delete(postformCtrl.deleteAll).get(postformCtrl.findAll)
    Router.route('/:id').delete(postformCtrl.delete).patch(postformCtrl.update);
    Router.route('/saveall').post(postformCtrl.createBulk)
    
    app.use("/api/v1/posform", Router);
    
    
  };