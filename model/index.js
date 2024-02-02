const dbConfig = require('../config/db.config')
const Sequelize = require("sequelize");
const sequalize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,

  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle,
  },
});

const db = {};
db.Sequelize = Sequelize;
db.sequalize = sequalize;


db.postform = require('./posform')(sequalize,Sequelize);
db.stock = require('./stockModel')(sequalize,Sequelize);

// Establishing associations between 'Posform' and 'Stock'
db.postform.hasMany(db.stock,{
  foreignKey : 'order_id',
  as: 'stock'
});
db.stock.belongsTo(db.postform,{
  foreignKey:'order_id',
  as:'excelimport'
})
module.exports = db;