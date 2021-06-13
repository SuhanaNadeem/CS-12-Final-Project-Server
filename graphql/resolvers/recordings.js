const { UserInputError, AuthenticationError } = require("apollo-server");

const User = require("../../models/User");

const checkUserAuth = require("../../util/checkUserAuth");

const speech = require("@google-cloud/speech");
const fs = require("fs");
const AmazonS3URI = require("amazon-s3-uri");

const {
  getCsFile,
  doesS3URLExist,
  handleCsFileDelete,
} = require("../../util/handleAWSFiles");
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
    async addEventRecordingUrl(
      _,
      { eventRecordingUrl, previousEventRecordingUrl, userId },
      context
    ) {
      console.log("addEventRecordingUrl entered");

      try {
        checkUserAuth(context);
      } catch (error) {
        throw new AuthenticationError(error);
      }

      const targetUser = await User.findById(userId);
      if (!targetUser) {
        throw new UserInputError("Invalid user id");
      }
      if (previousEventRecordingUrl && previousEventRecordingUrl != "") {
        for (var eventRecordingUrlGroup of targetUser.eventRecordingUrls) {
          if (eventRecordingUrlGroup.includes(previousEventRecordingUrl)) {
            console.log("adding to group");
            eventRecordingUrlGroup.push(eventRecordingUrl);
            break;
          }
        }
      } else {
        console.log("adding to new");
        eventRecordingUrlGroup = [];
        eventRecordingUrlGroup.push(eventRecordingUrl);
        targetUser.eventRecordingUrls.push(eventRecordingUrlGroup);
      }
      await targetUser.save();

      return eventRecordingUrlGroup;
    },

    async transcribeEventRecording(_, { recordingFileKey }, context) {
      console.log("entered event transcribe");
      try {
        checkUserAuth(context);
      } catch (error) {
        throw new AuthenticationError(error);
      }
      const client = new speech.SpeechClient();

      const file = await getCsFile(recordingFileKey);

      const recordingBytes = file.Body.toString("base64");

      const audio = {
        content: recordingBytes,
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

    async transcribeInterimRecording(_, { recordingBytes }, context) {
      console.log("entered interim transcribe");
      try {
        checkUserAuth(context);
      } catch (error) {
        throw new AuthenticationError(error);
      }
      const client = new speech.SpeechClient();

      const audio = {
        content: recordingBytes,
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

    async detectDanger(_, { recordingBytes, userId }, context) {
      console.log();
      console.log(
        "****************************************************************"
      );

      console.log("detectdanger entered");

      try {
        checkUserAuth(context);
      } catch (error) {
        throw new AuthenticationError(error);
      }

      const targetUser = await User.findById(userId);
      if (!targetUser || !recordingBytes || recordingBytes === "") {
        throw new UserInputError("Invalid user ID or file key");
      }
      const transcription =
        await module.exports.Mutation.transcribeInterimRecording(
          _,
          { recordingBytes },
          context
        );
      console.log("Transcription");
      console.log(transcription);
      const detectedStatus =
        await flaggedTokenResolvers.Mutation.matchStartTranscription(
          _,
          { transcription, userId },
          context
        );

      console.log();
      console.log(
        "___________________________exiting detectDanger____________________"
      );
      console.log();
      console.log("returning in detectDanger");
      console.log(detectedStatus);
      return detectedStatus;
    },

    async handleDanger(
      _,
      {
        eventRecordingFileKey,
        userId,
        previousEventRecordingUrl,
        eventRecordingUrl,
      },
      context
    ) {
      console.log(
        "//////////////////////////////////////////////////////////////"
      );
      console.log();
      console.log("handledanger entered");
      console.log(eventRecordingUrl);

      console.log(eventRecordingFileKey);
      console.log(userId);
      try {
        checkUserAuth(context);
      } catch (error) {
        throw new AuthenticationError(error);
      }

      const targetUser = await User.findById(userId);
      if (
        !targetUser ||
        !eventRecordingFileKey ||
        eventRecordingFileKey === ""
      ) {
        throw new UserInputError("Invalid user ID or file key");
      }
      const transcription =
        await module.exports.Mutation.transcribeEventRecording(
          _,
          { recordingFileKey: eventRecordingFileKey },
          context
        );

      console.log("Transcription");
      console.log(transcription);

      const detectedStatus =
        await flaggedTokenResolvers.Mutation.matchStopTranscription(
          _,
          { transcription, userId },
          context
        );
      const eventRecordingUrlGroup =
        await module.exports.Mutation.addEventRecordingUrl(
          _,
          { eventRecordingUrl, previousEventRecordingUrl, userId },
          context
        );
      console.log(eventRecordingUrlGroup);
      // return detectedStatus;

      console.log("event recording returning...");
      console.log(detectedStatus);

      console.log();
      console.log(
        "___________________________exiting handleDanger____________________"
      );
      console.log();

      return detectedStatus;
    },
  },
};
