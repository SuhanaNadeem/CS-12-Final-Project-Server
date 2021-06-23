const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { UserInputError, AuthenticationError } = require("apollo-server");

const SECRET_KEY = process.env.SECRET_USER_KEY;

const {
  validateUserRegisterInput,
  validateUserLoginInput,
} = require("../../util/validators");
const User = require("../../models/User");

const checkUserAuth = require("../../util/checkUserAuth");

const client = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

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
    async getUsers(_, {}, context) {
      try {
        checkUserAuth(context);
      } catch (error) {
        throw new AuthenticationError();
      }
      const users = await User.find();
      console.log(users);
      return users;
    },
    async getUser(_, {}, context) {
      try {
        const user = checkUserAuth(context);
        const targetUser = await User.findById(user.id);
        return targetUser;
      } catch (error) {
        throw new AuthenticationError();
      }
    },
    async getUserById(_, { userId }, context) {
      console.log("comes in here in getUserById");

      try {
        checkUserAuth(context);
      } catch (error) {
        throw new Error(error);
      }

      const targetUser = await User.findById(userId);
      if (!targetUser) {
        throw new UserInputError("No such user", {
          errors: {
            userId: "There is no user with this ID",
          },
        });
      } else {
        return targetUser;
      }
    },
  },
  Mutation: {
    async signupUser(_, { name, email, password, confirmPassword }, context) {
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
        name,
        email,
        password,
        friendIds: [],
        requesterIds: [],
        createdAt: new Date(),
      });

      const res = await newUser.save();

      const token = generateToken(res);

      return { ...res._doc, id: res._id, token };
    },

    async loginUser(_, { email, password }, context) {
      console.log("Enters log in user");

      const { errors } = validateUserLoginInput(email, password);

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
        var user = checkUserAuth(context);
      } catch (error) {
        throw new Error(error);
      }

      const targetUser = await User.findById(userId);
      if (targetUser) {
        await targetUser.delete();
        return "Delete Successful";
      } else {
        throw new UserInputError("Invalid input");
      }
    },

    async setMessageInfo(
      _,
      { userId, newPanicMessage, newPanicPhone },
      context
    ) {
      console.log("enters setMessageInfo");

      try {
        checkUserAuth(context);
      } catch (error) {
        throw new Error(error);
      }
      const targetUser = await User.findById(userId);
      if (!targetUser || (!newPanicMessage && !newPanicPhone)) {
        throw new UserInputError("Invalid input");
      }
      if (newPanicMessage && newPanicMessage !== "") {
        targetUser.panicMessage = newPanicMessage;
      }
      if (newPanicPhone && newPanicPhone != "") {
        targetUser.panicPhone = newPanicPhone;
      }

      await targetUser.save();
      return targetUser;
    },

    async authenticateUserByContext(_, {}, context) {
      try {
        checkUserAuth(context);
      } catch (error) {
        throw new AuthenticationError(error);
      }
    },

    async sendTwilioSMS(
      _,
      { message, phoneNumber, eventRecordingUrl },
      context
    ) {
      console.log("enters sendTwilioSMS");
      console.log("sends this eventRecordingUrl:");
      console.log(eventRecordingUrl);
      try {
        checkUserAuth(context);
      } catch (error) {
        throw new Error(error);
      }

      if (
        (!message || message === "") &&
        (!phoneNumber || phoneNumber === "")
      ) {
        throw new UserInputError("Invalid input");
      }

      // TODO: With the free trial account, we can only send to verified phone numbers. In production, with a paid Twilio account,
      // this if block can be removed to allow the user to send a message to any phone number.
      if (phoneNumber != process.env.TWILIO_VERIFIED_PHONE_NUMBER) {
        throw new UserInputError("Phone number not verified");
      }
      client.messages
        .create({
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phoneNumber,
          body: message,
        })
        .then((result) => {
          console.log("SUCCESSFULLY SENT TWILIO MESSAGE");
          console.log(result);
        })
        .catch((err) => {
          console.log("DIDN'T SEND TWILIO MESSAGE");
          console.log(err);
        });

      return "Sent " + message;
    },

    async setUserLocation(_, { location, userId }, context) {
      try {
        checkUserAuth(context);
      } catch (error) {
        throw new Error(error);
      }
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        throw new UserInputError("Invalid input");
      }

      targetUser.location = location;
      await targetUser.save();
      return location;
    },

    async toggleLocationOn(_, { userId }, context) {
      try {
        checkUserAuth(context);
      } catch (error) {
        throw new Error(error);
      }
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        throw new UserInputError("Invalid input");
      }

      var toggledLocation = !targetUser.locationOn;
      targetUser.locationOn = toggledLocation;

      await targetUser.save();
      return toggledLocation;
    },
  },
};
