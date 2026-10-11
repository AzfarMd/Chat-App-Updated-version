//it prevents us to login again and again every time we use the app

const jwt = require("jsonwebtoken");
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "60d",//set the expiry time of the token as 30 days
    })
}
module.exports = generateToken;