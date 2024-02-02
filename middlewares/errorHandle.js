const errorHandler = (err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
  
    res.status(status).json({
      status: 'error',
      message,
    });
  };
module.exports = errorHandler