const { UserInputError } = require("apollo-server");

const User = require("../../models/User");
const EventRecording = require("../../models/EventRecording");

const transcriptionResolvers = require("./transcriptions");
const flaggedTokenResolvers = require("./flaggedTokens");
const fileResolvers = require("./files");
const userResolvers = require("./users");

const AmazonS3URI = require("amazon-s3-uri");

module.exports = {
  Query: {
    // Retrieve an array of event recording groups by user ID
    async getEventRecordingsByUser(_, { userId }, context) {
      await userResolvers.Mutation.authenticateUserByContext(_, {}, context);

      const targetUser = await User.findById(userId);
      const eventRecordings = await EventRecording.find({ userId });

      if (!targetUser || !eventRecordings) {
        throw new UserInputError("Invalid input");
      } else {
        return eventRecordings;
      }
    },
  },
  Mutation: {
    // Adds an eventRecordingUrl to an unfinished eventRecording object and finishes it, returns updated eventRecordingUrls of eventRecording object
    async addToFinishedEventRecording(
      _,
      { eventRecordingUrl, userId },
      context
    ) {
      // "Finished" means status is "stop" or "panic"

      // Must add to/create an unfinished EventRecording object, and set its finished property to true

      const targetEventRecording = await EventRecording.findOne({
        finished: false,
        userId,
      });

      if (targetEventRecording) {
        // Detected "stop" or "panic" and has >0 associated recordings
        targetEventRecording.eventRecordingUrls.push(eventRecordingUrl);
        targetEventRecording.finished = true;
        await targetEventRecording.save();

        return targetEventRecording.eventRecordingUrls;
      } else {
        // Detected "stop" or "panic" and has 0 associated recordings
        const newEventRecording = new EventRecording({
          eventRecordingUrls: [],
          finished: true,
          userId,
          createdAt: new Date(),
        });
        newEventRecording.eventRecordingUrls.push(eventRecordingUrl);
        await newEventRecording.save();
        return newEventRecording.eventRecordingUrls;
      }
    },

    // Adds an eventRecordingUrl to an unfinished eventRecording object, returns updated eventRecordingUrls of eventRecording object
    async addToUnfinishedEventRecording(
      _,
      { eventRecordingUrl, userId },
      context
    ) {
      // "Unfinished" means status is "start"

      // Must add to/create an unfinished EventRecording object, and keep its finished property to false
      const targetEventRecording = await EventRecording.findOne({
        finished: false,
        userId,
      });

      if (targetEventRecording) {
        // Detected "start" and has >0 associated recordings
        targetEventRecording.eventRecordingUrls.push(eventRecordingUrl);
        await targetEventRecording.save();
        return targetEventRecording.eventRecordingUrls;
      } else {
        // Detected "start" and has 0 associated recordings
        const newEventRecording = new EventRecording({
          eventRecordingUrls: [],
          finished: false,
          userId,
          createdAt: new Date(),
        });
        newEventRecording.eventRecordingUrls.push(eventRecordingUrl);
        await newEventRecording.save();
        return newEventRecording.eventRecordingUrls;
      }
    },

    // Add URL to the latest EventRecording object
    async addEventRecordingUrl(
      _,
      { eventRecordingUrl, userId, finish },
      context
    ) {
      await userResolvers.Mutation.authenticateUserByContext(_, {}, context);

      const targetUser = await User.findById(userId);
      if (!targetUser) {
        throw new UserInputError("Invalid user id");
      }

      var recordingUrls;

      if (finish) {
        // "Finished" means status has become "stop" or "panic"
        recordingUrls =
          await module.exports.Mutation.addToFinishedEventRecording(
            _,
            { userId, eventRecordingUrl },
            context
          );
      } else {
        // "Unfinished" means status has become "start"
        recordingUrls =
          await module.exports.Mutation.addToUnfinishedEventRecording(
            _,
            { userId, eventRecordingUrl },
            context
          );
      }

      return recordingUrls;
    },

    // Remove individual URL from AWS
    async removeEventRecordingUrl(_, { recordingUrl }, context) {
      await userResolvers.Mutation.authenticateUserByContext(_, {}, context);

      const { key } = AmazonS3URI(recordingUrl); // Get the AWS fileKey of the recording

      if (recordingUrl && recordingUrl !== "" && key) {
        await fileResolvers.Mutation.removeAWSFile(
          _,
          {
            fileKey: key,
          },
          context
        );

        return "Deleted successfully";
      } else {
        throw new UserInputError("Invalid input");
      }
    },

    // Delete entire event recording group, with all its URLs removed from AWS first
    async removeAndDeleteEventRecording(_, { eventRecordingId }, context) {
      await userResolvers.Mutation.authenticateUserByContext(_, {}, context);

      const targetEventRecording = await EventRecording.findById(
        eventRecordingId
      );
      if (
        targetEventRecording &&
        targetEventRecording.eventRecordingUrls &&
        targetEventRecording.eventRecordingUrls.length != 0
      ) {
        // Remove each URL from AWS
        for (var targetRecordingUrl of targetEventRecording.eventRecordingUrls) {
          await module.exports.Mutation.removeEventRecordingUrl(
            _,
            { recordingUrl: targetRecordingUrl },
            context
          );
        }

        // Remove EventRecording object
        await targetEventRecording.delete();

        return "Deleted successfully";
      }
    },

    // Delete an event recording group, without removing its links from AWS
    async deleteEventRecording(_, { eventRecordingId }, context) {
      await userResolvers.Mutation.authenticateUserByContext(_, {}, context);

      const targetEventRecording = await EventRecording.findById(
        eventRecordingId
      );
      if (targetEventRecording) {
        await targetEventRecording.delete();

        return "Deleted successfully";
      } else {
        throw new UserInputError("Invalid Input");
      }
    },

    // Delete one URL from event recording group, and remove it from AWS
    async removeAndDeleteEventRecordingUrl(
      _,
      { eventRecordingId, recordingUrl },
      context
    ) {
      await userResolvers.Mutation.authenticateUserByContext(_, {}, context);

      const targetEventRecording = await EventRecording.findById(
        eventRecordingId
      );
      var index;
      if (
        targetEventRecording &&
        targetEventRecording.eventRecordingUrls.includes(recordingUrl)
      ) {
        // Delete the URL from the EventRecording group
        index = targetEventRecording.eventRecordingUrls.indexOf(recordingUrl);
        targetEventRecording.eventRecordingUrls.splice(index, 1);
        await targetEventRecording.save();

        // Remove the URL from AWS
        await module.exports.Mutation.removeEventRecordingUrl(
          _,
          { recordingUrl },
          context
        );

        return "Deleted successfully";
      }
    },

    // Indicates whether danger is detected; returns strings "start" to trigger recording if needed, otherwise "stop"
    async detectDanger(_, { recordingBytes, userId }, context) {
      console.log("detectDanger ENTERED");
      await userResolvers.Mutation.authenticateUserByContext(_, {}, context);

      const targetUser = await User.findById(userId);
      if (!targetUser || !recordingBytes || recordingBytes === "") {
        throw new UserInputError("Invalid user ID or file key");
      }

      // Transcribe the recording by bytes
      const transcription =
        await transcriptionResolvers.Mutation.transcribeRecording(
          _,
          { recordingBytes, userId },
          context
        );

      console.log("detectDanger TRANSCRIBED:");
      console.log(transcription);

      // Match the transcription to get new status (start, stop, panic)
      const detectedStatus =
        await flaggedTokenResolvers.Mutation.matchStartTranscription(
          _,
          { transcription, userId },
          context
        );

      console.log("detectDanger RETURNING:");
      console.log(detectedStatus);
      return detectedStatus;
    },

    // Checks whether or not to stop recording after it has been started; returns strings "stop" or "panic" if needed, otherwise "start"
    async handleDanger(
      _,
      { recordingBytes, userId, eventRecordingUrl },
      context
    ) {
      console.log("handleDanger ENTERED");

      await userResolvers.Mutation.authenticateUserByContext(_, {}, context);

      const targetUser = await User.findById(userId);
      if (
        !targetUser ||
        !recordingBytes ||
        recordingBytes === "" ||
        eventRecordingUrl === "" ||
        !eventRecordingUrl
      ) {
        throw new UserInputError("Invalid user ID or file key");
      }

      // Transcribe the recording by bytes
      const transcription =
        await transcriptionResolvers.Mutation.transcribeRecording(
          _,
          { recordingBytes, userId },
          context
        );

      console.log("handleDanger TRANSCRIBED:");
      console.log(transcription);

      // Match the transcription to get new status (start, stop, panic)
      const detectedStatus =
        await flaggedTokenResolvers.Mutation.matchStopTranscription(
          _,
          { transcription, userId },
          context
        );
      const eventRecording = await module.exports.Mutation.addEventRecordingUrl(
        _,
        {
          eventRecordingUrl,
          userId,
          finish: detectedStatus === "stop" || detectedStatus === "panic",
        },
        context
      );
      console.log(eventRecording);

      console.log("handleDanger RETURNING:");
      console.log(detectedStatus);

      return detectedStatus;
    },
  },
};
