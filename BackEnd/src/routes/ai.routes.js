const express = require('express');
const aiController = require("../controllers/ai.controller");

const router = express.Router();

const validateRequest = (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ 
      success: false,
      error: 'Request body is required.' 
    });
  }

  if (!req.is('application/json')) {
    return res.status(400).json({ 
      success: false,
      error: 'Content-Type must be application/json.' 
    });
  }
  
  next();
};


const routeRateLimit = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  req.requestTime = now;
  next();
};

// Routes
router.post("/get-review", validateRequest, routeRateLimit, aiController.getReview);


module.exports = router;