const { AuthenticationError } = require("apollo-server");

const jwt = require("jsonwebtoken");
const SECRET_USER_KEY = process.env.SECRET_USER_KEY;

/* Resources:
   - https://www.npmjs.com/package/jsonwebtoken
   - https://betterprogramming.pub/authentication-and-authorization-using-jwt-with-node-js-4099b2e6ca1f?gi=a79e9e4cb688
*/

module.exports = (context) => {
  const authHeader = context.req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split("Bearer ")[1];

    if (token) {
      try {
        const user = jwt.verify(token, SECRET_USER_KEY);
        return user;
      } catch (err) {
        throw new AuthenticationError("Invalid/Expired token");
      }
    }
    throw new Error("Authentication token must be 'Bearer [token]");
  }

  throw new Error("Authorization header must be provided");
};
