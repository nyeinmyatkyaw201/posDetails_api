const { DATEONLY } = require("sequelize");

module.exports = (sequalize, Sequelize) => {
  const Posform = sequalize.define("excelimport", {
    order_id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      notEmpty:true
    },
    counter_no: {
      type: Sequelize.INTEGER,
      notEmpty:true,
      allowNull: false,
    },
    casher_name: {
      type: Sequelize.STRING,
      allowNull: false,
      notEmpty: true
    },
    order_date: {
      type: Sequelize.DATEONLY,
      // allowNull:false,
      defaultValue: Sequelize.NOW,
    },
    refund: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    discount: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    discount_percentage: {
      type: Sequelize.INTEGER,
      // defaultValue: "No Discount",
    },
  });
  return Posform;
};
