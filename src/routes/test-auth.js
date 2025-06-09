// authTestController.js
const testAuth = (req, res) => {
  // req.user should be set by your verifyToken middleware
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'No user info found in token' });
  }

  return res.status(200).json({ success: true, user: req.user });
};

module.exports = { testAuth };
