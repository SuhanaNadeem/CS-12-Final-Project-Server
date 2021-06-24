const { UserInputError, AuthenticationError } = require("apollo-server");

const User = require("../../models/User");
const Transcription = require("../../models/Transcription");

const userResolvers = require("./users");

const speech = require("@google-cloud/speech"); // Required for speech-to-text

module.exports = {
  Query: {
    // With the given userId, returns the latest transcription from the user
    async getTranscriptionByUser(_, { userId }, context) {
      await userResolvers.Mutation.authenticateUserByContext(_, {}, context);

      const targetUser = await User.findById(userId);
      const targetTranscription = await Transcription.findOne({ userId });

      if (!targetUser || !targetTranscription) {
        throw new UserInputError("Invalid input");
      } else {
        return targetTranscription.latestTranscription;
      }
    },
  },
  Mutation: {
    // Returns transcription of recording in string format
    async transcribeRecording(_, { recordingBytes, userId }, context) {
      /* Resources:
       - https://cloud.google.com/speech-to-text/docs/libraries
       - https://www.youtube.com/watch?v=naZ8oEKuR44&ab_channel=GoogleCloudTech
       
       Note: Audio input was reconfigured and transformed to bytes uniquely in the front-end for compatibility
       with this feature
      */

      await userResolvers.Mutation.authenticateUserByContext(_, {}, context);
      const client = new speech.SpeechClient(); // Create speech-to-text client

      const audio = {
        content: recordingBytes, // Set bytes as audio content
      };

      // The following configuration was optimized for our Expo-AV use-case
      const config = {
        encoding: "LINEAR16",
        sampleRateHertz: 44100,
        languageCode: "en-US",
        profanityFilter: true,
      };

      // Make the transcription request
      const request = {
        audio: audio,
        config: config,
      };

      const [response] = await client.recognize(request); // Run speech to text
      // Parse results
      const transcription = response.results
        .map((result) => result.alternatives[0].transcript)
        .join("\n");

      // Set new transcription as user's latest transcription
      await module.exports.Mutation.setTranscriptionByUser(
        _,
        { userId, transcription },
        context
      );

      return transcription;
    },

    // Replaces a previous Transcription object associated with the given user or creates a new one with the given transcription
    async setTranscriptionByUser(_, { userId, transcription }, context) {
      const targetTranscription = await Transcription.findOne({ userId });

      if (targetTranscription) {
        // Modify transcription
        targetTranscription.latestTranscription = transcription;
        await targetTranscription.save();
      } else {
        // Create new transcription
        const newTranscription = new Transcription({
          latestTranscription: transcription,
          userId,
          createdAt: new Date(),
        });
        await newTranscription.save();
      }
    },
  },
};
