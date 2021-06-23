const { UserInputError, AuthenticationError } = require("apollo-server");

const User = require("../../models/User");
const EventRecording = require("../../models/EventRecording");

const checkUserAuth = require("../../util/checkUserAuth");

const transcriptionResolvers = require("./transcriptions");

const flaggedTokenResolvers = require("./flaggedTokens");
const fileResolvers = require("./files");
const userResolvers = require("./users");

const AmazonS3URI = require("amazon-s3-uri");

module.exports = {
  Query: {
    // async getEventRecordingTriggered(_, { userId }, context) {
    //   try {
    //     checkUserAuth(context);
    //   } catch (error) {
    //     throw new AuthenticationError();
    //   }
    //   const targetUser = await User.findById(userId);
    //   if (!targetUser) {
    //     throw new UserInputError("Invalid user ID");
    //   }
    //   const eventRecordingTriggered = targetUser.eventRecordingTriggered;
    //   return eventRecordingTriggered;
    // },
    async getEventRecordingsByUser(_, { userId }, context) {
      console.log("comes in here in getEventRecordingsByUser");

      try {
        checkUserAuth(context);
      } catch (error) {
        throw new Error(error);
      }

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
    async addToFinishedEventRecording(
      _,
      { eventRecordingUrl, userId },
      context
    ) {
      const targetEventRecording = await EventRecording.findOne({
        finished: false,
        userId,
      });

      if (targetEventRecording) {
        // Detected "stop" or "panic" and has >0 associated recordings
        console.log(1);
        targetEventRecording.eventRecordingUrls.push(eventRecordingUrl);
        targetEventRecording.finished = true;
        await targetEventRecording.save();

        return targetEventRecording.eventRecordingUrls;
      } else {
        console.log(2);
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
    async addToUnfinishedEventRecording(
      _,
      { eventRecordingUrl, userId },
      context
    ) {
      const targetEventRecording = await EventRecording.findOne({
        finished: false,
        userId,
      });

      if (targetEventRecording) {
        console.log(3);
        // Detected "start" and has >0 associated recordings
        targetEventRecording.eventRecordingUrls.push(eventRecordingUrl);
        await targetEventRecording.save();
        return targetEventRecording.eventRecordingUrls;
      } else {
        console.log(4);
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
    async addEventRecordingUrl(
      _,
      { eventRecordingUrl, userId, finish },
      context
    ) {
      console.log("addEventRecordingUrl entered");

      await userResolvers.Mutation.authenticateUserByContext(_, {}, context);

      const targetUser = await User.findById(userId);
      if (!targetUser) {
        throw new UserInputError("Invalid user id");
      }

      var recordingUrls;

      if (finish) {
        recordingUrls =
          await module.exports.Mutation.addToFinishedEventRecording(
            _,
            { userId, eventRecordingUrl },
            context
          );
      } else {
        recordingUrls =
          await module.exports.Mutation.addToUnfinishedEventRecording(
            _,
            { userId, eventRecordingUrl },
            context
          );
      }
      return recordingUrls;
    },

    async removeEventRecordingUrl(_, { recordingUrl }, context) {
      console.log("removeEventRecordingUrl entered");

      await userResolvers.Mutation.authenticateUserByContext(_, {}, context);
      const { key } = AmazonS3URI(recordingUrl);

      if (recordingUrl && recordingUrl !== "" && key) {
        await fileResolvers.Mutation.deleteCsFile(
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

    async removeAndDeleteEventRecording(_, { eventRecordingId }, context) {
      console.log("deleteEventRecording entered");

      await userResolvers.Mutation.authenticateUserByContext(_, {}, context);

      const targetEventRecording = await EventRecording.findById(
        eventRecordingId
      );
      if (
        targetEventRecording &&
        targetEventRecording.eventRecordingUrls &&
        targetEventRecording.eventRecordingUrls.length != 0
      ) {
        for (var targetRecordingUrl of targetEventRecording.eventRecordingUrls) {
          await module.exports.Mutation.removeEventRecordingUrl(
            _,
            { recordingUrl: targetRecordingUrl },
            context
          );
        }
        await targetEventRecording.delete();

        return "Deleted successfully";
      }
    },

    async deleteEventRecording(_, { eventRecordingId }, context) {
      console.log("deleteEventRecording entered");

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

    async removeAndDeleteEventRecordingUrl(
      _,
      { eventRecordingId, recordingUrl },
      context
    ) {
      console.log("deleteEventRecording entered");

      await userResolvers.Mutation.authenticateUserByContext(_, {}, context);

      const targetEventRecording = await EventRecording.findById(
        eventRecordingId
      );
      var index;
      if (
        targetEventRecording &&
        targetEventRecording.eventRecordingUrls.includes(recordingUrl)
      ) {
        index = targetEventRecording.eventRecordingUrls.indexOf(recordingUrl);
        targetEventRecording.eventRecordingUrls.splice(index, 1);
        await targetEventRecording.save();
        await module.exports.Mutation.removeEventRecordingUrl(
          _,
          { recordingUrl },
          context
        );

        return "Deleted successfully";
      }
    },

    async detectDanger(_, { recordingBytes, userId }, context) {
      console.log();
      console.log(
        "****************************************************************"
      );

      console.log("detectdanger entered");

      await userResolvers.Mutation.authenticateUserByContext(_, {}, context);

      const targetUser = await User.findById(userId);
      if (!targetUser || !recordingBytes || recordingBytes === "") {
        throw new UserInputError("Invalid user ID or file key");
      }
      const transcription =
        await transcriptionResolvers.Mutation.transcribeRecording(
          _,
          { recordingBytes, userId },
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
      { recordingBytes, userId, eventRecordingUrl },
      context
    ) {
      console.log(
        "//////////////////////////////////////////////////////////////"
      );
      console.log();
      console.log("handledanger entered");
      console.log(eventRecordingUrl);

      console.log(userId);
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
      // const transcription = await module.exports.Mutation.transcribeRecording(
      //   _,
      //   { recordingBytes, userId },
      //   context
      // );

      const transcription =
        await transcriptionResolvers.Mutation.transcribeRecording(
          _,
          { recordingBytes, userId },
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
