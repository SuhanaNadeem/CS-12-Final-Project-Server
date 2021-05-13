const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { UserInputError } = require("apollo-server");

const {
  validateUserRegisterInput,
  validateUserLoginInput,
} = require("../../util/validators");
const SECRET_KEY = process.env.SECRET_USER_KEY;
const User = require("../../models/User");

const checkAdminAuth = require("../../util/checkAdminAuth");

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    SECRET_KEY
    //{ expiresIn: "3h" }
  );
}

module.exports = {
  Query: {
    async getUser(_, {}, context) {
      try {
        const user = checkUserAuth(context);
        const targetUser = await User.findById(user.id);
        return targetUser;
      } catch (error) {
        throw new AuthenticationError();
      }
    },
  },
  Mutation: {
    async signupUser(_, { email, password, confirmPassword }, context) {
      var { valid, errors } = validateUserRegisterInput(
        email,
        password,
        confirmPassword
      );
      if (!valid) {
        throw new UserInputError("Errors", { errors });
      }

      const checkUser = await User.findOne({ email });
      if (checkUser) {
        throw new UserInputError("Email already exists", {
          errors: {
            email: "A user with this email already exists",
          },
        });
      }

      password = await bcrypt.hash(password, 12);

      const newUser = new User({
        createdAt: new Date(),
      });

      const res = await newUser.save();

      const token = generateToken(res);

      return { ...res._doc, id: res._id, token };
    },

    async loginUser(_, { email, password }, context) {
      const { errors, valid } = validateUserLoginInput(email, password);
      if (!valid) {
        throw new UserInputError("Errors", { errors });
      }

      const user = await User.findOne({ email });

      if (!user) {
        errors.email = "User not found";
        throw new UserInputError("User not found", {
          errors,
        });
      }

      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        errors.password = "Wrong credentials";
        throw new UserInputError("Wrong credentials", {
          errors,
        });
      }

      const token = generateToken(user);
      return { ...user._doc, id: user._id, token };
    },

    async deleteUser(_, { userId }, context) {
      try {
        var user = checkAdminAuth(context);
      } catch (error) {
        try {
          var user = checkMentorAuth(context);
        } catch (error) {
          throw new Error(error);
        }
      }

      const targetUser = await User.findById(userId);
      if (targetUser) {
        await targetUser.delete();
        return "Delete Successful";
      } else {
        throw new UserInputError("Invalid input");
      }
    },
  },
};
