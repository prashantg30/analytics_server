var jwt = require("jsonwebtoken");
require('dotenv').config();

function verifyToken(req, res) {
  const tokenHeader = req.headers.authorization;
  if (!tokenHeader) {
    console.log("Token not found")
    return false
  }
  const token = tokenHeader.split(" ")[1];
  const verifiedToken = jwt.verify(token, process.env.DB_SSP);
  // console.log("VERIFIED TOKEN: ", verifiedToken);
  if (!verifiedToken.username) {
    console.log('Invalid token')
    return false
  }
  res.locals.auth = verifiedToken;
  return true
}

module.exports = verifyToken;



