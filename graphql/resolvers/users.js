const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { UserInputError, AuthenticationError } = require("apollo-server");

const SECRET_KEY = process.env.SECRET_USER_KEY;

const {
  validateUserRegisterInput,
  validateUserLoginInput,
} = require("../../util/validators");
const User = require("../../models/User");

const checkAdminAuth = require("../../util/checkAdminAuth");
const checkUserAuth = require("../../util/checkUserAuth");

const speech = require("@google-cloud/speech");
const fs = require("fs");

const { getCsFile } = require("../../util/handleFileUpload");

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
        createdAt: new Date(),
      });

      const res = await newUser.save();

      const token = generateToken(res);

      return { ...res._doc, id: res._id, token };
    },

    async loginUser(_, { email, password }, context) {
      console.log("Enters log in user");

      const { errors, valid } = validateUserLoginInput(email, password);

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
        var admin = checkAdminAuth(context);
      } catch (error) {
        try {
          var user = checkUserAuth(context);
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

    async addS3RecordingUrl(_, { s3RecordingUrl, userId }, context) {
      console.log("Enters s3 recording");

      try {
        checkUserAuth(context);
      } catch (error) {
        throw new Error(error);
      }

      const targetUser = await User.findById(userId);
      if (!targetUser) {
        throw new UserInputError("Invalid user id");
      }
      if (!targetUser.s3RecordingUrls.includes(s3RecordingUrl)) {
        await targetUser.s3RecordingUrls.push(s3RecordingUrl);
        await targetUser.save();
      }
      console.log(targetUser.s3RecordingUrls);

      return targetUser.s3RecordingUrls;
    },

    async transcribeAudioChunk(_, { s3AudioChunkUrl }, context) {
      console.log("Enters transcribeAudioChunk...");

      try {
        checkUserAuth(context);
      } catch (error) {
        throw new Error(error);
      }

      const client = new speech.SpeechClient();
      console.log("now");

      // const file = fs.readFileSync(s3AudioChunkUrl);
      // const audioBytes = file.toString("base64");

      const file = getCsFile(s3AudioChunkUrl);
      const audioBytes = file.toString("base64");

      const audio = {
        content: audioBytes,
      };
      const config = {
        encoding: "LINEAR16",
        // sampleRateHertz: 1600,
        languageCode: "en-US",
      };
      const request = {
        audio: audio,
        config: config,
      };

      const [response] = await client.recognize(request);
      const transcription = response.results
        .map((result) => result.alternatives[0].transcript)
        .join("\n");
      console.log(`Transcription: ${transcription}`);

      return transcription;
    },
  },
};
