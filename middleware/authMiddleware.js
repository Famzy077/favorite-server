const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Use same secret used during sign
    req.user = decoded; // Attach decoded user (e.g., { id, email }) to the request
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

module.exports = { verifyToken };