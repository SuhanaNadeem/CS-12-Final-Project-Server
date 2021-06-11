const { UserInputError, AuthenticationError } = require("apollo-server");

const User = require("../../models/User");

const checkUserAuth = require("../../util/checkUserAuth");

const speech = require("@google-cloud/speech");
const fs = require("fs");
const AmazonS3URI = require("amazon-s3-uri");

const { getCsFile, doesS3URLExist } = require("../../util/handleAWSFiles");

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

    async transcribeInterimRecording(
      _,
      { interimRecordingFileKey, userId },
      context
    ) {
      console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
      console.log("Enters transcribeInterimRecording...");
      console.log(interimRecordingFileKey);
      console.log(userId);
      try {
        checkUserAuth(context);
      } catch (error) {
        throw new AuthenticationError(error);
      }

      const client = new speech.SpeechClient();
      // console.log("now");
      console.log(0.5);
      const file = await getCsFile(interimRecordingFileKey);
      console.log(1);
      const audioBytes = file.Body.toString("base64");
      console.log(2);
      //TODO IDEA: add a profanity checker
      // //   const file = getCsFile(interimRecordingFileKey);
      // //   const audioBytes = file.toString("base64");

      // const file1 = fs.readFileSync(
      //   "C:/Users/16475/Documents/CS 12 Final Project/CS-12-Final-Project-Server/util/3949-Tacc-Dr-31.wav"
      // );

      // const file2 = fs.readFileSync(
      //   "C:/Users/16475/Documents/CS 12 Final Project/CS-12-Final-Project-Server/util/util_audio.raw.wav"
      // );
      // console.log(file2);

      // const audioBytes1 = file1.toString("base64");
      // console.log(3);
      // const audioBytes2 = file2.toString("base64");
      // console.log(4);
      const audio = {
        content: audioBytes,
      };

      const config = {
        encoding: "LINEAR16",
        sampleRateHertz: 44100,
        languageCode: "en-US",
      };
      const request = {
        audio: audio,
        config: config,
      };
      console.log("before");
      const [response] = await client.recognize(request);
      const transcription = response.results
        .map((result) => result.alternatives[0].transcript)
        .join("\n");
      console.log(`Transcription: ${transcription}`);

      console.log("after");
      return transcription;

      // return "enters";
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
