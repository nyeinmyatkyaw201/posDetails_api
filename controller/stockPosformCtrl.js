const db = require("../model/index");
const AppError = require("../utils/apperror");
const catchAsync = require("../utils/catchAsync");
const Stock = db.stock;
const Posform = db.postform;

exports.createOrdersAndStocks = async (req, res) => {
  const ordersAndStocks = req.body;

  try {
    let transactionError = null;
    const processedOrderIDs = new Set();

    await db.sequalize.transaction(async (t) => {
      
      for (const data of ordersAndStocks) {
        const { order_id, casher_name, counter_no,order_date, discount_percentage, refund, stock } = data;

        if (!processedOrderIDs.has(order_id)) {
          processedOrderIDs.add(order_id);

          const orderValidation = validateOrderID({ order_id });

          if (!orderValidation.success) {
            transactionError = orderValidation.message;
            return;
          }

          let order = await Posform.findOne({ where: { order_id } });

          if (!order) {
            const formDataValidation = validatePosformData({
              order_id,
              casher_name,
              counter_no,
              discount_percentage,
            });

            if (!formDataValidation.success) {
              transactionError = formDataValidation.message;
              return;
            }
            order = await Posform.create(
              {
                order_id,
                casher_name,
                counter_no,
                refund,
                discount_percentage,
              },
              { transaction: t }
            );

            if (!order) {
              transactionError = "Failed to create order.";
              return;
            }
          }
        }

        const stockItem = stock;
        const amount = stockItem.price * stockItem.quantity;
        const discount_amount = (amount / 100) * stockItem.discount_percentage;
        const sub_total = amount - discount_amount;

        const stockData = {
          order_id,
          item: stockItem.item,
          price: stockItem.price,
          quantity: stockItem.quantity,
          amount,
          discount_percentage: stockItem.discount_percentage,
          discount_amount,
          sub_total,
          rechange: stockItem.rechange,
        };

        const validatedData = validateSingleData(stockData);

        if (!validatedData.success) {
          transactionError = validatedData.message;
          return;
        }

        await Stock.create(validatedData.data, { transaction: t });

        const createdStockRecord = await Stock.findOne({
          where: { order_id, item: stockItem.item },
          transaction: t,
        });
        console.log("Created Stock Record:", createdStockRecord);
      }
    });

    if (transactionError) {
      return res.status(400).send({
        status: "Error",
        message: transactionError,
      });
    }

    res.status(200).send({
      status: "Success",
      message: "Data creation successful",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      status: "Error",
      message: "Internal Server Error",
    });
  }
};






// exports.createOrderAndStock = async (req, res) => {
//   // Extract data from the request
//   const {
//     order_id,
//     casher_name,
//     counter_no,
//     discount_percentage,
//     refund,
//     stock,
//   } = req.body;

//   try {
//     let order;
//     let transactionError = null;

//     // Use Sequelize's transaction to ensure atomicity
//     await db.sequalize.transaction(async (t) => {
//       // Check if the order already exists

//       const orderIDvalidation = validateOrderID({
//         order_id,
//       });

//       if (!orderIDvalidation.success) {
//         transactionError = orderIDvalidation.message;
//         return; // Exit the transaction early
//       }
//       order = await Posform.findOne({ where: { order_id } });

//       if (!order) {
//         // Validate order data if it doesn't exist
//         const posformDataValidation = validatePosformData({
//           order_id,
//           casher_name,
//           counter_no,
//           discount_percentage,
//         });

//         if (!posformDataValidation.success) {
//           transactionError = posformDataValidation.message;
//           return; // Exit the transaction early
//         }

//         // Create order record
//         order = await Posform.create(
//           {
//             order_id,
//             casher_name,
//             counter_no,
//             order_date: req.body.order_date,
//             refund,
//             discount: req.body.discount,
//             discount_percentage,
//           },
//           { transaction: t }
//         );

//         // Check if order creation was successful
//         if (!order) {
//           transactionError = "Failed to create order.";
//           return; // Exit the transaction early
//         }
//       }

//       // Set stock data with order_id
//       const stockDataArray = stock.map((stockItem) => {
//         const amount = stockItem.price * stockItem.quantity;
//         const discount_amount = (amount / 100) * stockItem.discount_percentage;
//         const sub_total = amount - discount_amount;

//         return {
//           order_id: order.order_id,
//           item: stockItem.item,
//           price: stockItem.price,
//           quantity: stockItem.quantity,
//           amount,
//           discount_percentage: stockItem.discount_percentage,
//           discount_amount,
//           sub_total,
//           rechange: stockItem.rechange,
//         };
//       });

//       // Validate stock data
//       const validatedData = validateBulkData(stockDataArray);

//       if (!validatedData.success) {
//         transactionError = validatedData.message;
//         return; // Exit the transaction early
//       }

//       // Use bulkCreate to insert multiple stock records
//       await Stock.bulkCreate(validatedData.data, { transaction: t });

//       // If needed, you can query the created stock records after bulkCreate
//       const createdStockRecords = await Stock.findAll({
//         where: { order_id: order.order_id },
//         transaction: t,
//       });
//       console.log("Created Stock Records:", createdStockRecords);
//     });

//     // Check if an error occurred during the transaction
//     if (transactionError) {
//       return res.status(400).send({
//         status: "Error",
//         message: transactionError,
//       });
//     }

//     // Send the success response
//     res.status(200).send({
//       status: "Success",
//       message: "Data creation successful",
//     });
//   } catch (error) {
//     // Handle other errors (e.g., database query errors)
//     console.error(error);
//     res.status(500).send({
//       status: "Error",
//       message: "Internal Server Error",
//     });
//   }
// };

exports.StockAndOrder = async (req, res) => {
  // Extract data from the request
  const {
    order_id,
    casher_name,
    counter_no,
    discount_percentage,
    refund,
    stock,
    order_date,
  } = req.body;

  try {
    let order;

    // Use Sequelize's transaction to ensure atomicity
    await db.sequalize.transaction(async (t) => {
      // Validate order data
      const posformDataValidation = await validatePosformDataForCreate({
        order_id,
        counter_no,
        casher_name,
        order_date,
        discount_percentage,
        
      });

      if (!posformDataValidation.success) {
        return res.status(400).send({
          status: "Error",
          message: posformDataValidation.message,
        });
      }

      // Create order record
      order = await Posform.create(
        {
          order_id,
          casher_name,
          counter_no,
          order_date,
          refund,
          discount: req.body.discount,
          discount_percentage,
        },
        { transaction: t }
      );

      // Check if order creation was successful
      if (!order) {
        return res.status(500).send({
          status: "Error",
          message: "Failed to create order.",
        });
      }

      // Set stock data with order_id
      const stockDataArray = stock.map((stockItem) => {
        const amount = stockItem.price * stockItem.quantity;
        const discount_amount = (amount / 100) * stockItem.discount_percentage;
        const sub_total = amount - discount_amount;

        return {
          order_id: order.order_id,
          item: stockItem.item,
          price: stockItem.price,
          quantity: stockItem.quantity,
          amount,
          discount_percentage: stockItem.discount_percentage,
          discount_amount,
          sub_total,
          rechange: stockItem.rechange,
        };
      });

      const validatedData = validateBulkData(stockDataArray);
      console.log("Validated Data:", validatedData);

      // Use bulkCreate to insert multiple stock records
      await Stock.bulkCreate(validatedData.data, { transaction: t });

      // If needed, you can query the created stock records after bulkCreate
      const createdStockRecords = await Stock.findAll({
        where: { order_id: order.order_id },
        transaction: t,
      });
      console.log("Created Stock Records:", createdStockRecords);

      // Send the success response inside the transaction
      res.status(200).send({
        status: "Success",
        message: "Data creation successful",
        order: order, // Include the order information in the response
      });

      // Add a return statement to terminate the function execution after sending the response
      return;
    });

    // If the code reaches this point, it means the transaction was successful, but the response was already sent inside the transaction
  } catch (error) {
    // Handle database query errors
    console.error(error);
    res.status(500).send({
      status: "Error",
      message: "Internal Server Error",
    });
  }
};




function validateBulkData(data) {
  console.log("Raw Data:", data);
  const validatedData = { success: true, message: null, data: [] };

  const validItems = [
    "Pencil",
    "Pen",
    "Book",
    "Eraser",
    "Ruler",
    "Drawing Pencil",
  ];

  if (!Array.isArray(data)) {
    validatedData.success = false;
    validatedData.message = "Invalid data format. Must be an array.";
    return validatedData;
  }

  data.forEach((row) => {
    if (typeof row.item !== "string" || row.item == null) {
      validatedData.success = false;
      validatedData.message = `Invalid item. Must be a string or cannot be null.`;
      return; // Exit early
    }

    if (!validItems.includes(row.item)) {
      validatedData.success = false;
      validatedData.message = `Invalid item. Must be one of: ${validItems.join(
        ", "
      )}.`;
      return; // Exit early
    }

    if (row.price == null || typeof row.price !== "number") {
      validatedData.success = false;
      validatedData.message = `Invalid price. Must be a number or price cannot be null.`;
      return; // Exit early
    }

    if (typeof row.quantity !== "number" || row.quantity == null) {
      validatedData.success = false;
      validatedData.message = `Invalid quantity. Must be a number or quantity cannot be null.`;
      return; // Exit early
    }

    if (
      typeof row.discount_percentage !== "number" ||
      row.discount_percentage > 100
    ) {
      validatedData.success = false;
      validatedData.message = `Invalid discount_percentage. Must be a number or cannot be greater than 100.`;
      return; // Exit early
    }

    if (row.rechange == null || typeof row.rechange !== "boolean") {
      validatedData.success = false;
      validatedData.message = `Invalid rechange. Must be a boolean or rechange cannot be null.`;
      return; // Exit early
    }

    if (row.order_id == null || typeof row.order_id !== "number") {
      validatedData.success = false;
      validatedData.message = `Invalid order Id. Must be a number or order Id cannot be null.`;
      return; // Exit early
    }

    // Add other validations as needed

    if (validatedData.success) {
      validatedData.data.push(row);
    }
  });

  return validatedData;
}

//validation Stock and create
async function validatePosformDataForCreate(data) {
  const { order_id, casher_name, counter_no, discount_percentage } = data;
  const validation = { success: true, message: null };

  // Validate order_id is a number
  if (typeof order_id !== "number" || order_id == null) {
    validation.success = false;
    validation.message = "Invalid order_id. Must be a number.Cannot be null";
    return validation;
  }

  // Check for uniqueness of order_id
  const existingOrder = await Posform.findOne({ where: { order_id } });
  if (existingOrder) {
    validation.success = false;
    validation.message = "Order with the provided order_id already exists.";
    return validation;
  }

  // Validate counter_no is an integer
  if (typeof counter_no !== "number" || !Number.isInteger(counter_no) || counter_no == null) {
    validation.success = false;
    validation.message = "Invalid counter_no. Must be an integer.Cannot Be Null";
    return validation;
  }
  console.log(typeof casher_name,">>>>>>>>>>>")
  // Validate casher_name is a string
  if ( typeof casher_name !== 'string'|| casher_name == null ||  /^\d+$/.test(casher_name.trim())) {
    validation.success = false;
    validation.message = "Invalid casher_name. Must be a string. Cannot be null.";
    return validation;
  }
  // Validate discount_percentage is a number not greater than 100
  if (typeof discount_percentage !== "number" || discount_percentage > 100) {
    validation.success = false;
    validation.message =
      "Invalid discount_percentage. Must be a number not greater than 100.";
    return validation;
  }

  // Add other validations for Posform fields as needed

  return validation;
}

// <<<<<<<<<<< For create Order and Stock>>>>>>>>>>>>>>>>

function validateSingleData(data) {
  console.log("Raw Data:", data);
  const validatedData = { success: true, message: null, data: null };

  const validItems = [
    "Pencil",
    "Pen",
    "Book",
    "Eraser",
    "Ruler",
    "Drawing Pencil",
  ];

  if (typeof data.item !== "string" || data.item == null) {
    validatedData.success = false;
    validatedData.message = `Invalid item. Must be a string and cannot be null.`;
    return validatedData;
  }

  if (!validItems.includes(data.item)) {
    validatedData.success = false;
    validatedData.message = `Invalid item. Must be one of: ${validItems.join(", ")}.`;
    return validatedData;
  }

  if (data.price == null || typeof data.price !== "number") {
    validatedData.success = false;
    validatedData.message = `Invalid price. Must be a number and price cannot be null.`;
    return validatedData;
  }

  if (typeof data.quantity !== "number" || data.quantity == null) {
    validatedData.success = false;
    validatedData.message = `Invalid quantity. Must be a number and quantity cannot be null.`;
    return validatedData;
  }

  if (
    typeof data.discount_percentage !== "number" ||
    data.discount_percentage > 100
  ) {
    validatedData.success = false;
    validatedData.message = `Invalid discount_percentage. Must be a number and cannot be greater than 100.`;
    return validatedData;
  }

  if (data.rechange == null || typeof data.rechange !== "boolean") {
    validatedData.success = false;
    validatedData.message = `Invalid rechange. Must be a boolean and rechange cannot be null.`;
    return validatedData;
  }

  if (data.order_id == null || typeof data.order_id !== "number") {
    validatedData.success = false;
    validatedData.message = `Invalid order Id. Must be a number and order Id cannot be null.`;
    return validatedData;
  }

  validatedData.data = data;
  return validatedData;
}
//validation for createOrder and Stock
function validatePosformData(data) {
  const { order_id, casher_name, counter_no, discount_percentage } = data;
  const validation = { success: true, message: null };

  // Validate order_id is a number
  if (typeof order_id != "number" || typeof order_id == "string" || order_id == null) {
    validation.success = false;
    validation.message =
      "Invalid order_id. Must be a number or a string representing a number and Cannot be null";
    return validation;
  }
  // Check for uniqueness of order_id (you may need to implement this based on your database model)
  // Validate counter_no is an integer
  if (typeof counter_no !== "number" || !Number.isInteger(counter_no) || counter_no == null) {
    validation.success = false;
    validation.message = "Invalid counter_no. Must be an integer.counter_no cannot be null";
    return validation;
  }

  // Validate casher_name is a string
  if (typeof casher_name !== "string" || casher_name == null ) {
    validation.success = false;
    validation.message = "Invalid casher_name. Must be a string or cannot be null";
    return validation;
  }

  // Validate discount_percentage is a number not greater than 100
  if (typeof discount_percentage !== "number" || discount_percentage > 100) {
    validation.success = false;
    validation.message =
      "Invalid discount_percentage. Must be a number not greater than 100.";
    return validation;
  }

  return validation;
}
function validateOrderID(data) {
  const { order_id } = data;
  const validation = { success: true, message: null };

  // Validate order_id is a number
  if (typeof order_id != "number" || typeof order_id == "string" || order_id == null) {
    validation.success = false;
    validation.message =
      "Invalid order_id. Must be a number or a string representing a number or cannot be null";
    return validation;
  }

  return validation;
}
