module.exports = (sequalize, Sequelize) => {
    const Stock = sequalize.define("stock", {
      item: {
        type: Sequelize.STRING,
        notEmpty:true
      },
      price: {
        type: Sequelize.INTEGER,
        notEmpty:true,
        allowNull: false,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        notEmpty: true
      },
      amount: {
        type: Sequelize.INTEGER,
      },
      discount_percentage: {
        type: Sequelize.INTEGER,
        defaultValue:0
      },
      discount_amount: {
        type: Sequelize.INTEGER,

      },
      sub_total: {
        type: Sequelize.INTEGER,
     
        // defaultValue: "No Discount",
      },
      rechange:{
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      }
    });
    return Stock;
  };