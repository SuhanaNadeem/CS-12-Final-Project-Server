const { UserInputError, AuthenticationError } = require("apollo-server");

const User = require("../../models/User");

const checkUserAuth = require("../../util/checkUserAuth");

const speech = require("@google-cloud/speech");
const fs = require("fs");
const AmazonS3URI = require("amazon-s3-uri");

const { getCsFile, doesS3URLExist } = require("../../util/handleAWSFiles");
const flaggedTokenResolvers = require("./flaggedTokens");

module.exports = {
  Query: {
    async getEventRecordingTriggered(_, { userId }, context) {
      try {
        checkUserAuth(context);
      } catch (error) {
        throw new AuthenticationError();
      }
      const targetUser = await User.findById(userId);

      if (!targetUser) {
        throw new UserInputError("Invalid user ID");
      }

      const eventRecordingTriggered = targetUser.eventRecordingTriggered;

      return eventRecordingTriggered;
    },
  },
  Mutation: {
    async addEventRecordingUrl(_, { eventRecordingUrl, userId }, context) {
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
      if (!targetUser.eventRecordingUrls.includes(eventRecordingUrl)) {
        await targetUser.eventRecordingUrls.push(eventRecordingUrl);
        await targetUser.save();
      }

      return targetUser.eventRecordingUrls;
    },

    async transcribeInterimRecording(_, { interimRecordingFileKey }, context) {
      console.log("entered transcribe");
      try {
        checkUserAuth(context);
      } catch (error) {
        throw new AuthenticationError(error);
      }
      const client = new speech.SpeechClient();

      const file = await getCsFile(interimRecordingFileKey);

      const audioBytes = file.Body.toString("base64");

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

      const [response] = await client.recognize(request);
      const transcription = response.results
        .map((result) => result.alternatives[0].transcript)
        .join("\n");
      console.log(`Transcription: ${transcription}`);

      return transcription;
    },

    async detectDanger(_, { interimRecordingFileKey, userId }, context) {
      console.log("detectdanger entered");

      console.log(interimRecordingFileKey);
      console.log(userId);
      try {
        checkUserAuth(context);
      } catch (error) {
        throw new AuthenticationError(error);
      }

      const targetUser = await User.findById(userId);
      if (
        !targetUser ||
        !interimRecordingFileKey ||
        interimRecordingFileKey === " "
      ) {
        throw new UserInputError("Invalid user ID or file key");
      }
      const transcription =
        await module.exports.Mutation.transcribeInterimRecording(
          _,
          { interimRecordingFileKey },
          context
        );
      console.log("Transcription");
      console.log(transcription);
      const detected = await flaggedTokenResolvers.Mutation.matchTranscription(
        _,
        { transcription, userId },
        context
      );
      return false;
    },
  },
};
