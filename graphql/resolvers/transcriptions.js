const { UserInputError, AuthenticationError } = require("apollo-server");

const User = require("../../models/User");
const EventRecording = require("../../models/EventRecording");

const checkUserAuth = require("../../util/checkUserAuth");

const speech = require("@google-cloud/speech");

const {
  getCsFile,
  doesS3URLExist,
  handleCsFileDelete,
} = require("../../util/handleAWSFiles");

const Transcription = require("../../models/Transcription");
const userResolvers = require("./users");

module.exports = {
  Query: {
    async getTranscriptionByUser(_, { userId }, context) {
      console.log("comes in here in getTranscriptionByUser");

      try {
        checkUserAuth(context);
      } catch (error) {
        throw new Error(error);
      }

      const targetUser = await User.findById(userId);
      const targetTranscription = await Transcription.findOne({ userId });
      console.log("Target transcription");
      console.log(targetTranscription);
      if (!targetUser || !targetTranscription) {
        throw new UserInputError("Invalid input");
      } else {
        return targetTranscription.latestTranscription;
      }
    },
  },
  Mutation: {
    async transcribeRecording(_, { recordingBytes, userId }, context) {
      await userResolvers.Mutation.authenticateUserByContext(_, {}, context);
      const client = new speech.SpeechClient();

      const audio = {
        content: recordingBytes,
      };

      const config = {
        encoding: "LINEAR16",
        sampleRateHertz: 44100,
        languageCode: "en-US",
        profanityFilter: true,
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

      const targetTranscription = await Transcription.findOne({ userId });

      if (targetTranscription) {
        targetTranscription.latestTranscription = transcription;
        await targetTranscription.save();
        console.log("Edited transcription");
        console.log(targetTranscription.latestTranscription);
      } else {
        const newTranscription = new Transcription({
          latestTranscription: transcription,
          userId,
          createdAt: new Date(),
        });
        console.log("New transcription");
        console.log(newTranscription.latestTranscription);
        await newTranscription.save();
      }

      return transcription;
    },
  },
};
