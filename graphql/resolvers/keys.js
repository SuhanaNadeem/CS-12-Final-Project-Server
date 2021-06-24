const { UserInputError } = require("apollo-server");

const User = require("../../models/User");
const userResolvers = require("./users");

module.exports = {
  Mutation: {
    // Store phrase that will allow user to verbally trigger an event recording
    async setStartKey(_, { userId, startKey }, context) {
      await userResolvers.Mutation.authenticateUserByContext(_, {}, context);
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        throw new UserInputError("Invalid user ID");
      }

      // Check if it equals the other two keys currently set
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

    // Store phrase that will allow user to verbally stop an event recording
    async setStopKey(_, { userId, stopKey }, context) {
      await userResolvers.Mutation.authenticateUserByContext(_, {}, context);

      const targetUser = await User.findById(userId);
      if (!targetUser) {
        throw new UserInputError("Invalid user ID");
      }

      // Check if it equals the other two keys currently set
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

    // Store phrase that will allow user to verbally stop and send an alert text about an event recording
    async setPanicKey(_, { userId, panicKey }, context) {
      await userResolvers.Mutation.authenticateUserByContext(_, {}, context);

      const targetUser = await User.findById(userId);
      if (!targetUser) {
        throw new UserInputError("Invalid user ID");
      }

      // Check if it equals the other two keys currently set
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
