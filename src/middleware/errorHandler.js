const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Default to 500 Internal Server Error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal Server Error' : err.name || 'Error',
    message: statusCode === 500 ? 'Something went wrong on our end' : message,
    code: statusCode,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;