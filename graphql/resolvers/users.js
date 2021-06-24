const { UserInputError, AuthenticationError } = require("apollo-server");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.SECRET_USER_KEY;

const {
  validateUserRegisterInput,
  validateUserLoginInput,
} = require("../../util/validators");

const User = require("../../models/User");

const checkUserAuth = require("../../util/checkUserAuth");

// Set up Twilio client for SMS
const client = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Create unique JWT authorization token for user security
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    SECRET_KEY
  );
}

module.exports = {
  Query: {
    // Get all users in database
    async getUsers(_, {}, context) {
      try {
        checkUserAuth(context);
      } catch (error) {
        throw new AuthenticationError();
      }
      const users = await User.find();
      return users;
    },

    // Get user by specific user ID
    async getUser(_, {}, context) {
      try {
        const user = checkUserAuth(context);
        const targetUser = await User.findById(user.id);
        return targetUser;
      } catch (error) {
        throw new AuthenticationError();
      }
    },

    // Get user by specific user ID
    async getUserById(_, { userId }, context) {
      await module.exports.Mutation.authenticateUserByContext(_, {}, context);

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
    async authenticateUserByContext(_, {}, context) {
      try {
        checkUserAuth(context);
      } catch (error) {
        throw new AuthenticationError(error);
      }
    },

    // Creates a User object with passed arguments and saves it to the database
    async signupUser(_, { name, email, password, confirmPassword }, context) {
      var { valid, errors } = validateUserRegisterInput(
        email,
        password,
        confirmPassword
      ); // Determine if the information provided is valid for an email and matching passwords
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

      password = await bcrypt.hash(password, 12); // Hash out password

      const newUser = new User({
        name,
        email,
        password,
        friendIds: [],
        requesterIds: [],
        createdAt: new Date(),
      });

      const res = await newUser.save();

      const token = generateToken(res); // Create JWT token

      return { ...res._doc, id: res._id, token }; // Token passed, needs to be used as header in localhost
    },

    // Returns a User object of the user whose credentials match the passed arguments
    async loginUser(_, { email, password }, context) {
      const { errors } = validateUserLoginInput(email, password);

      const user = await User.findOne({ email });

      if (!user) {
        errors.email = "User not found";
        throw new UserInputError("User not found", {
          errors,
        });
      }

      const match = await bcrypt.compare(password, user.password); // Compare protected password using user token

      if (!match) {
        errors.password = "Wrong credentials";
        throw new UserInputError("Wrong credentials", {
          errors,
        });
      }

      const token = generateToken(user); // Create new JWT token

      return { ...user._doc, id: user._id, token }; // Token passed, needs to be used as header in localhost
    },

    // Removes a User from the database with given userId
    async deleteUser(_, { userId }, context) {
      await module.exports.Mutation.authenticateUserByContext(_, {}, context);

      const targetUser = await User.findById(userId);
      if (targetUser) {
        await targetUser.delete();
        return "Delete Successful";
      } else {
        throw new UserInputError("Invalid input");
      }
    },

    // Updates the panic message information in the given userId's User object in the database, returns userId's User object
    async setMessageInfo(
      _,
      { userId, newPanicMessage, newPanicPhone },
      context
    ) {
      await module.exports.Mutation.authenticateUserByContext(_, {}, context);

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

    // Sends an SMS message to pre-set number using Twilio, returns the message sent as a string
    async sendTwilioSMS(_, { message, phoneNumber }, context) {
      /* Resources:
         - https://www.twilio.com/docs/sms/send-messages
         - https://www.twilio.com/docs/sms/quickstart/node
      */

      await module.exports.Mutation.authenticateUserByContext(_, {}, context);
      if (
        (!message || message === "") &&
        (!phoneNumber || phoneNumber === "")
      ) {
        throw new UserInputError("Invalid input");
      }

      // With our free trial account, we can only send to verified phone numbers. In production, with a paid Twilio account,
      // this if-block can be removed to allow the user to send a message to any phone number, with no breaking changes.
      if (phoneNumber != process.env.TWILIO_VERIFIED_PHONE_NUMBER) {
        throw new UserInputError("Phone number not verified");
      }

      // Create message using Twilio client
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

    // Writes the strinigified JSON location string to the userId's User object. Returns given location string
    async setUserLocation(_, { location, userId }, context) {
      await module.exports.Mutation.authenticateUserByContext(_, {}, context);

      const targetUser = await User.findById(userId);
      if (!targetUser) {
        throw new UserInputError("Invalid input");
      }

      targetUser.location = location;
      await targetUser.save();
      return location;
    },

    // Returns boolean indicating whether location sharing is on or off after the mutation toggles it
    async toggleLocationOn(_, { userId }, context) {
      await module.exports.Mutation.authenticateUserByContext(_, {}, context);

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
