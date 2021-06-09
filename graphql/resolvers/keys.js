const { UserInputError, AuthenticationError } = require("apollo-server");

const User = require("../../models/User");
const checkUserAuth = require("../../util/checkUserAuth");

module.exports = {
  Query: {},
  Mutation: {
    async setStartKey(_, { userId, startKey }, context) {
      console.log("Enters setStartKey");

      try {
        checkUserAuth(context);
      } catch (error) {
        throw new AuthenticationError(error);
      }
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        throw new UserInputError("Invalid user ID");
      }

      if (
        (targetUser.panicKey &&
          startKey.toLowerCase().trim() ===
            targetUser.panicKey.toLowerCase().trim()) ||
        (targetUser.stopKey &&
          startKey === targetUser.stopKey.toLowerCase().trim())
      ) {
        throw new UserInputError("Invalid key - matches other entered key(s)");
      }
      targetUser.startKey = startKey;
      await targetUser.save();
      return "Successfully set start key as " + targetUser.startKey;
    },

    async setStopKey(_, { userId, stopKey }, context) {
      console.log("Enters setStopKey");

      try {
        checkUserAuth(context);
      } catch (error) {
        throw new AuthenticationError(error);
      }

      const targetUser = await User.findById(userId);
      if (!targetUser) {
        throw new UserInputError("Invalid user ID");
      }
      if (
        (targetUser.panicKey &&
          stopKey.toLowerCase().trim() ===
            targetUser.panicKey.toLowerCase().trim()) ||
        (targetUser.startKey &&
          stopKey === targetUser.startKey.toLowerCase().trim())
      ) {
        throw new UserInputError("Invalid key - matches other entered key(s)");
      }

      targetUser.stopKey = stopKey;
      await targetUser.save();
      return "Successfully set stop key as " + targetUser.stopKey;
    },

    async setPanicKey(_, { userId, panicKey }, context) {
      console.log("Enters setPanicKey");

      try {
        checkUserAuth(context);
      } catch (error) {
        throw new AuthenticationError(error);
      }

      const targetUser = await User.findById(userId);
      if (!targetUser) {
        throw new UserInputError("Invalid user ID");
      }
      if (
        (targetUser.startKey &&
          panicKey.toLowerCase().trim() ===
            targetUser.startKey.toLowerCase().trim()) ||
        (targetUser.stopKey &&
          panicKey === targetUser.stopKey.toLowerCase().trim())
      ) {
        throw new UserInputError("Invalid key - matches other entered key(s)");
      }
      targetUser.panicKey = panicKey;
      await targetUser.save();
      return "Successfully set panic key as " + targetUser.panicKey;
    },
  },
};
