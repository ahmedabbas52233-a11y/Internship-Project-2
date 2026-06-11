const jwt = require('jsonwebtoken');
const { User } = require('../models');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Access denied. No token provided.' }
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'decodelabs-secret-key');
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Token valid but user not found.' }
      });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid token.' }
    });
  }
};

module.exports = auth;
