const db = require("../model/index");

const AppError = require("../utils/apperror");
const catchAsync = require("../utils/catchAsync");


const Posform = db.postform;


var objdata = [];

exports.save = catchAsync(async (req, res, next) => {
  // if(!req.body.casher_name || !req.body.order_id || !req.body.counter_no){
  //   return next(new AppError("Required casher name or order id or counter number",400))
  // }
  const existingOrder = await Posform.findOne({
    where: { order_id: req.body.order_id },
  });
  if (existingOrder) {
    return res.status(400).send({
      status: "Fail",
      message: "Order ID already exists",
    });
  }
  console.log(req.body.casher_name);
  const postform = await Posform.create({
    order_id: req.body.order_id,
    casher_name: req.body.casher_name,
    counter_no: req.body.counter_no,
    order_date: req.body.order_date,
    refund: req.body.refund,
    discount: req.body.discount,
    discount_percentage: req.body.discount_percentage,
  });

  res.status(200).json({
    status: "success",
    message: "save successfully",
    RequestedAt: req.requestTime,
    postform,
  });
});

exports.deleteAll = catchAsync(async (req, res, next) => {
  Posform.destroy({
    where: {},
    truncate: false,
  });
  res.status(200).json({
    status: "success",
    message: "delete successfully",
  });
});

exports.delete = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  Posform.destroy({
    where: { order_id: id },
  }).then((num) => {
    console.log(num);
    if (num == 1) {
      res.send({
        message: "Posform was deleted successfully!",
      });
    } else {
      return next(
        new AppError(
          `Cannot delete posform with id=${id}. Maybe posform was not found!`,
          401
        )
      );
    }
  });
});
exports.update = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  Posform.update(req.body, {
    where: { order_id: id },
  }).then((num) => {
    console.log(num);
    if (num == 1) {
      res.send({
        message: "POSform was updated successfully!",
      });
    } else {
      return next(
        new AppError(
          `Cannot delete Tutorial with id=${id}. Maybe Tutorial was not found!`,
          401
        )
      );
    }
  });
});
// exports.findAll = catchAsync(async (req,res,next)=>{
//     // const posform = req.query;
//     const data = Posform.findAll();
//     res.status(200).json({
//       status: "success",
//       RequestedAt: req.requestTime,
//       data,
//     });
// });
exports.findAll = (req, res) => {
  const posform = req.query;
  Posform.findAll(posform)
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
// exports.createBulk = async (req, res) => {
//   try {
//     if (!req.body || !Array.isArray(req.body)) {
//       return res.status(400).send({
//         status: "Fail",
//         message: "Invalid or empty request body for bulk insertion",
//       });
//     }

//     // Bulk Insert
//     const orders = await Posform.bulkCreate(req.body);
//     res.status(201).send({
//       status: "Success",
//       message: "Bulk insertion successful",
//       data: orders,
//     });
//   } catch (error) {
//     // Extract IDs from the request body
//     const newIds = req.body.map((data) => data.order_id);
//     // Check if any of the new IDs already exist in the database
//     const existingIds = await Posform.findAll({
//       where: {
//         order_id: newIds,
//       },
//       attributes: ["order_id"], // Only fetch the IDs for existing records
//     });
//     if (existingIds.length > 0) {
//       return res.status(400).send({
//         status: "Fail",
//         message: "One or more IDs already exist in the database",
//         existingIds: existingIds.map((data) => data.order_id),
//       });
//     } else {
//       res.status(400).send({
//         status: "Fail",
//         message: "Error occurred during bulk insertion" || error.message,
//       });
//     }
//   }
// };

exports.createBulk = async (req, res) => {
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
    const orders = await Posform.bulkCreate(validatedData.data);
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

  const uniqueOrderIds = new Set();
  // const numericFields = ['counter_no', 'discount_percentage'];

 

// Adding order_id values from the array of objects to the set
objdata.forEach(data => {
  uniqueOrderIds.add(data.order_id);
});

  data.forEach((row) => {
    // Validate order_id uniqueness
    if (
      row.order_id == null||
      typeof row.order_id != "number" ||
      uniqueOrderIds.has(row.order_id)
    ) {
      validatedData.success = false;
      console.log(row);

      validatedData.message = `Invalid or duplicate order_id . Must be a unique number or order ID cannot be null`;
      return;
    }
    uniqueOrderIds.add(row.order_id);

    // Validate casher_name is a string
    if (typeof( row.casher_name) !== "string" || row.casher_name == null) {
      validatedData.success = false;
      validatedData.message = `Invalid casher_name. Must be a string or Cannot be null.`;
      return;
    }

    // Validate counter_no is an integer
    if (row.counter_no == null|| typeof (row.counter_no) !== "number") {
      validatedData.success = false;
      validatedData.message = `Invalid counter_no. Must be an integer or counter_no cannot be null.`;
      return;
    }

    // Validate order_date is a valid date
    const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;
    const parsedDate = new Date(row.order_date);
    if (isNaN(parsedDate.getTime()) || !dateFormatRegex.test(row.order_date)) {
      validatedData.success = false;
      validatedData.message = `Invalid date format. Must be a valid date.`;
      return;
    }
    if (typeof (row.refund) != "boolean" || row.refund == null) {
      console.log(typeof row.refund)
      validatedData.success = false;
      validatedData.message = `Invalid refund. Must be boolean or runfund cannot be null.`;
      return;
    }
    if (row.discount == null || typeof (row.discount) != "boolean") {
      console.log(row.discount)

      validatedData.success = false;
      validatedData.message = `Invalid discount. Must be boolean or discount cannot be null.`;
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

    // Add other validations as needed

    validatedData.data.push(row);
  });

  return validatedData;
}


