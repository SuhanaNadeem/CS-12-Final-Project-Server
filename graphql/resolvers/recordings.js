const { UserInputError, AuthenticationError } = require("apollo-server");

const User = require("../../models/User");

const checkUserAuth = require("../../util/checkUserAuth");

const speech = require("@google-cloud/speech");
const fs = require("fs");
const AmazonS3URI = require("amazon-s3-uri");

const { getCsFile, doesS3URLExist } = require("../../util/handleAWSFiles");
const FlaggedTokens = require("../../models/FlaggedTokens");

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
  },

  async detectDanger(_, { interimRecordingFileKey, userId }, context) {
    console.log(interimRecordingFileKey);
    console.log(userId);
    try {
      checkUserAuth(context);
    } catch (error) {
      throw new AuthenticationError(error);
    }

    const targetUser = await User.getUserById(userId);
    if (
      !targetUser ||
      !interimRecordingFileKey ||
      interimRecordingFileKey === " "
    ) {
      throw new UserInputError("Invalid user ID or file key");
    }
    transcription = await module.exports.Mutation.transcribeInterimRecording(
      _,
      { interimRecordingFileKey },
      context
    );
    console.log("Transcription");
    console.log(transcription);

    // TODO do the matching to figure out whether to start the event recording
    var userTokens = transcription.split(" ");

    userTokens = userTokens.filter((a) => a !== "is");
    userTokens = userTokens.filter((a) => a !== "as");
    userTokens = userTokens.filter((a) => a !== "this");
    userTokens = userTokens.filter((a) => a !== "that");
    userTokens = userTokens.filter((a) => a !== "the");
    userTokens = userTokens.filter((a) => a !== "a");

    // Get array of all tokens of a police and thief
    const policeTokens = await FlaggedToken.find({ name: "Police" });
    const thiefTokens = await FlaggedToken.find({ name: "Thief" });

    if (targetUser.startKey && targetUser.startKey != "") {
      // TODO match userTokens to startKey
    } else if (policeTokens) {
      // TODO match userTokens to policeTokens
    } else if (thiefTokens) {
      // TODO match userTokens to thiefTokens
    }
    return true; // temporary; return true if event was detected, false otherwise
  },
};
