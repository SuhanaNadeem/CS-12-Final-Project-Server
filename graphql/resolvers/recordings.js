const { UserInputError, AuthenticationError } = require("apollo-server");

const User = require("../../models/User");

const checkUserAuth = require("../../util/checkUserAuth");

const speech = require("@google-cloud/speech");
const fs = require("fs");

const { getCsFile } = require("../../util/handleAWSFiles");

module.exports = {
  Query: {
    async getEventRecordingState(_, { userId }, context) {
      try {
        checkUserAuth(context);
      } catch (error) {
        throw new AuthenticationError();
      }
      const targetUser = await User.findById(userId);

      if (!targetUser) {
        throw new UserInputError("Invalid user ID");
      }

      const eventRecordingState = targetUser.eventRecordingState;

      return eventRecordingState;
    },
  },
  Mutation: {
    async addS3RecordingUrl(_, { s3RecordingUrl, userId }, context) {
      console.log("Enters s3 recording");

      try {
        checkUserAuth(context);
      } catch (error) {
        throw new AuthenticationError(error);
      }

      const targetUser = await User.findById(userId);
      if (!targetUser) {
        throw new UserInputError("Invalid user id");
      }
      if (!targetUser.s3RecordingUrls.includes(s3RecordingUrl)) {
        await targetUser.s3RecordingUrls.push(s3RecordingUrl);
        await targetUser.save();
      }

      return targetUser.s3RecordingUrls;
    },

    async transcribeAudioChunk(_, { s3AudioChunkUrl, userId }, context) {
      console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
      console.log("Enters transcribeAudioChunk...");
      console.log(s3AudioChunkUrl);
      console.log(userId);
      try {
        checkUserAuth(context);
      } catch (error) {
        throw new AuthenticationError(error);
      }
      const test = getCsFile(s3AudioChunkUrl);
      console.log(
        "*****************************************************************"
      );
      console.log("new test: ");
      console.log(test);

      // const client = new speech.SpeechClient();
      // console.log("now");

      // const file = fs.readFileSync(s3AudioChunkUrl);
      // const audioBytes = file.toString("base64");

      // //   const file = getCsFile(s3AudioChunkUrl);
      // //   const audioBytes = file.toString("base64");

      // const audio = {
      //   content: audioBytes,
      // };
      // const config = {
      //   encoding: "LINEAR16",
      //   // sampleRateHertz: 1600,
      //   languageCode: "en-US",
      // };
      // const request = {
      //   audio: audio,
      //   config: config,
      // };

      // const [response] = await client.recognize(request);
      // const transcription = response.results
      //   .map((result) => result.alternatives[0].transcript)
      //   .join("\n");
      // console.log(`Transcription: ${transcription}`);

      // return transcription;

      return "enters";
    },

    async toggleEventRecordingState(_, { userId }, context) {
      console.log("Enters toggleEventRecordingState");

      try {
        checkUserAuth(context);
      } catch (error) {
        throw new AuthenticationError(error);
      }

      const targetUser = await User.findById(userId);
      if (!targetUser) {
        throw new UserInputError("Invalid user id");
      }

      targetUser.eventRecordingState =
        targetUser.eventRecordingState === undefined ||
        targetUser.eventRecordingState === false
          ? true
          : false;
      await targetUser.save();

      return targetUser.eventRecordingState;
    },
  },
};
