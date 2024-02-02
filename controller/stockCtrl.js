const db = require("../model/index");
const AppError = require("../utils/apperror");
const catchAsync = require("../utils/catchAsync");
const Stock = db.stock;
const Posform = db.postform;

const errorHandler = require("../middlewares/errorHandle");

const createValidationError = (field, type) => {
  return new AppError(`${field} is required and must be a ${type}`, 400);
};
exports.save = catchAsync(async (req, res, next) => {
  const validateString = (field, value) => {
    if (!value || typeof value !== "string") {
      throw createValidationError(field, "string");
    }
  };

  const validateNumberGreaterThanZero = (field, value) => {
    if (!value || typeof value !== "number" || value <= 0) {
      throw createValidationError(field, "number greater than zero");
    }
  };
  const validateDiscountPercentage = (field, value) => {
    if (value < 0 || value > 100 || typeof value !== "number") {
      throw createValidationError(field, "number between 0 and 100");
    }
  };

  const validateBoolean = (field, value) => {
    if (value === undefined || typeof value !== "boolean") {
      throw createValidationError(field, "boolean");
    }
  };

  try {
    validateString("item", req.body.item);
    validateNumberGreaterThanZero("price", req.body.price);
    validateNumberGreaterThanZero("quantity", req.body.quantity);
    validateDiscountPercentage(
      "discount_percentage",
      req.body.discount_percentage
    );
    validateBoolean("rechange", req.body.rechange);

    const amount = req.body.price * req.body.quantity;
    const discount_amount = (amount / 100) * req.body.discount_percentage;
    const sub_total = amount - discount_amount;

    const stock = await Stock.create({
      order_id: req.body.order_id,
      item: req.body.item,
      price: req.body.price,
      quantity: req.body.quantity,
      amount: amount,
      discount_percentage: req.body.discount_percentage,
      discount_amount: discount_amount,
      sub_total: sub_total,
      rechange: req.body.rechange,
    });

    res.status(200).json({
      status: "success",
      message: "Save successful",
      RequestedAt: req.requestTime,
      stock,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "error",
      message: error.message,
    });
  }
});
exports.findAll = (req, res) => {
  const stock = req.query;
  Stock.findAll(stock)
    .then((data) => {
      objdata = data;
      res.status(201).send({
        status: "success",
        data: data,
      });
    })
    .catch((err) => {
      res.status(500).send({
        status: "fail",
        message: err.message,
      });
    });
};

exports.deleteAll = catchAsync(async (req, res, next) => {
  Stock.destroy({
    where: {},
    truncate: false,
  });
  res.status(200).json({
    status: "success",
    message: "delete successfully",
  });
});

// exports.getStock = catchAsync(async (req, res) => {
 
  
//   const stock = await Stock.findAll();

//   if (!stock) {
//     return res.status(404).json({
//       status: "fail",
//       message: "Not found",
//     });
//   }

//   res.status(200).json({
//     status: "success",
//     RequestedAt: req.requestTime,
//     stock,
//   });
// });

exports.getStocks= catchAsync(async (req, res) => {
 
  id = req.params.id
  const stock = await Stock.findAll({where : {order_id : id}});

  if (!stock) {
    return res.status(404).json({
      status: "fail",
      message: "Not found",
    });
  }

  res.status(200).json({
    status: "success",
    RequestedAt: req.requestTime,
    stock,
  });
});

exports.getandDelete = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  try {
    // Assuming `findByForeignKey` is a method in your Stock model
    const stock = await Stock.findAll({
      where: { order_id: id },
    });

    if (stock && stock.length > 0) {
      const num = await Stock.destroy({
        where: { order_id: id },
      });
      console.log(num)
      if (num > 0) {
        res.send({
          message: "Stock was deleted successfully!",
        });
      } else {
        res.status(404).send({
          message: `Cannot delete stock with id=${id}. Maybe stock was not found!`,
        });
      }
    } else {
      res.status(404).send({
        message: `Stock with id=${id} not found!`,
      });
    }
  } catch (error) {
    next(error); // Let the error handling middleware deal with the error
  }
});


exports.delete = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  try {
    const num = await Stock.destroy({
      where: { id: id },
    });

    console.log(num);

    if (num == 1) {
      res.send({
        message: "Stock was deleted successfully!",
      });
    } else {
      res.status(401).send({
        message: `Cannot delete stock with id=${id}. Maybe stock was not found!`,
      });
    }
  } catch (error) {
    next(error); // Let the error handling middleware deal with the error
  }
});

exports.update = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  try {
    const num = await Stock.update(req.body, {
      where: { id: id },
    });

    if (num == 1) {
      res.status(200).json({
        message: "Stock was updated successfully!",
      });
    } else {
      return res.status(404).json({
        error: `Cannot update Stock with id-${id}. Maybe Stock was not found!`,
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
});

exports.getOrderStock = async (req, res) => {
  // Extract the 'id' parameter from the request
  const id = req.params.id;

  // Validate if 'id' is present and is a positive integer
  if (!id || !/^[1-9]\d*$/.test(id)) {
    return res.status(400).send({
      status: "Error",
      message: "Invalid or missing order_id. It must be a positive integer.",
    });
  }

  // Use Sequelize's findAll method to retrieve data from the 'Posform' table
  // Include the associated 'Stock' model using a foreign key relationship
  try {
    const data = await Posform.findAll({
      include: [
        {
          model: Stock,
          as: "stock", // Alias for the 'Stock' model
        },
      ],
      where: {
        order_id: id, // Filter by the 'order_id' column in the 'Posform' table
      },
    });

    // Send the retrieved data as a response with a 200 (OK) status code
    res.status(200).send({
      status: "Success",
      data,
    });
  } catch (error) {
    // Handle database query errors
    console.error("Error retrieving data:", error);
    res.status(500).send({
      status: "Error",
      message: "Internal Server Error",
    });
  }
};

exports.deleteOrderStock = async (req, res) => {
  // Extract the 'id' parameter from the request
  const id = req.params.id;

  // Validate if 'id' is present and is a positive integer
  if (!id || !/^[1-9]\d*$/.test(id)) {
    return res.status(400).send({
      status: "Error",
      message: "Invalid or missing order_id. It must be a positive integer.",
    });
  }

  try {
    // Use Sequelize's transaction to ensure atomicity
    await db.sequalize.transaction(async (t) => {
      // Also delete associated stock records
      await Stock.destroy({
        where: { order_id: id },
        transaction: t,
      });
      // Find the order record
      const order = await Posform.findOne({
        where: { order_id: id },
        transaction: t,
      });

      if (!order) {
        return res.status(404).send({
          status: "Error",
          message: "Order not found.",
        });
      }

      // Delete the order record
      await order.destroy({ transaction: t });
    });

    // Send the success response
    res.status(200).send({
      status: "Success",
      message: "Delete successful",
    });
  } catch (error) {
    // Handle database query errors
    console.error(error);
    res.status(500).send({
      status: "Error",
      message: "Internal Server Error",
    });
  }
};




exports.stockCreatebulk = async (req, res) => {
  try {
    if (!req.body || !Array.isArray(req.body)) {
      return res.status(400).send({
        status: "Fail",
        message: "Invalid or empty request body for bulk insertion",
      });
    }

    const validatedData = validateBulkData(req.body);
    if (validatedData.success == false) {
      return res.status(400).send({
        status: "Fail",
        message: validatedData.message,
      });
    }

    // Bulk Insert
    const orders = await Stock.bulkCreate(validatedData.data);
    res.status(201).send({
      status: "Success",
      message: "Bulk insertion successful",
      data: orders,
    });
  } catch (error) {
    console.error("Error during bulk insertion:", error);

    // Handle errors
    res.status(500).send({
      status: "Fail",
      message: "Error occurred during bulk insertion",
      error: error.message,
      stack: error.stack,
    });
  }
};
function validateBulkData(data) {
  const validatedData = { success: true, message: null, data: [] };

  data.forEach((row) => {
    const stocks = ['Pencil', 'Pen', 'Book', 'Eraser', 'Ruler', 'Drawing Pencil'];
 
    if (typeof row.item !== "string" || row.item == null ) {
      validatedData.success = false;
      validatedData.message = `Invalid item. Must be a string or Cannot be null.`;
      return;
    }
    if (!stocks.includes(row.item) ) {
      validatedData.success = false;
      validatedData.message = `Invalid item. Must include in item`;
      return;
    }
    // Validate counter_no is an integer
    if (row.price == null || typeof row.price !== "number") {
      validatedData.success = false;
      validatedData.message = `Invalid price. Must be an integer or price cannot be null.`;
      return;
    }
    if (typeof row.quantity != "number" || row.quantity == null) {
      console.log(typeof row.refund);
      validatedData.success = false;
      validatedData.message = `Invalid quantity. Must be number or quantity cannot be null.`;
      return;
    }

    // Validate discount_percentage is an integer
    if (
      typeof row.discount_percentage !== "number" ||
      row.discount_percentage > 100
    ) {
      validatedData.success = false;
      validatedData.message = `Invalid discount_percentage. Must be an integer or Cannot be greater than 100.`;
      return;
    }
    if (row.rechange == null || typeof row.rechange != "boolean") {
      validatedData.success = false;
      validatedData.message = `Invalid rechange. Must be boolean or rechange cannot be null.`;
      return;
    }
    if (row.order_id == null || typeof row.order_id != "number") {
      validatedData.success = false;
      validatedData.message = `Invalid order Id. Must be boolean or order Id cannot be null.`;
      return;
    }

    // Add other validations as needed

    validatedData.data.push(row);
  });

  return validatedData;
}

