const { UserInputError, AuthenticationError } = require("apollo-server");

const User = require("../../models/User");

const userResolvers = require("./users");

module.exports = {
  Query: {
    // Used in friend search system - searches all users in database with passed string in their name
    async getUserMatches(_, { name }, context) {
      /* Resources:
      - https://docs.mongodb.com/manual/tutorial/text-search-in-aggregation/
      - https://www.howtographql.com/react-apollo/7-filtering-searching-the-list-of-links/
      */

      await userResolvers.Mutation.authenticateUserByContext(_, {}, context);

      // Define search schema (user property)
      var agg = [
        {
          $match: {
            $text: { $search: name },
          },
        },
      ];

      const users = await User.aggregate(agg); // Aggregate to get matching users IDs

      const matchedUsers = []; // Need to get entire objects
      for (var user of users) {
        user = await User.findById(user._id); // Get entire user object through matched IDs
        matchedUsers.push(user);
      }
      return matchedUsers;
    },

    // Get an array of user objects who the given user has been sent friend requests bys
    async getFriendRequests(_, { userId }, context) {
      await userResolvers.Mutation.authenticateUserByContext(_, {}, context);
      const targetUser = await User.findById(userId);

      if (!targetUser) {
        throw new UserInputError("Invalid input ");
      } else if (targetUser.requesterIds.length != 0) {
        var requester;
        var requesters = [];
        for (var requesterId of targetUser.requesterIds) {
          requester = await User.findById(requesterId); // Get entire requester object
          requesters.push(requester);
        }
        return requesters;
      }

      return []; // Return empty list if no requesters exist
    },

    // Get all friends of a given user, identified by their id
    async getFriends(_, { userId }, context) {
      await userResolvers.Mutation.authenticateUserByContext(_, {}, context);
      const targetUser = await User.findById(userId);

      if (!targetUser) {
        throw new UserInputError("Invalid input ");
      } else if (targetUser.friendIds.length != 0) {
        var friend;
        var friends = [];
        for (var friendId of targetUser.friendIds) {
          friend = await User.findById(friendId); // Get entire friend object
          friends.push(friend);
        }
        return friends;
      }

      return [];
    },
  },
  Mutation: {
    // Sends a friend request from the requesterId User to receiverId User
    async sendFriendRequest(_, { requesterId, receiverId }, context) {
      await userResolvers.Mutation.authenticateUserByContext(_, {}, context);

      const requester = await User.findById(requesterId);
      const receiver = await User.findById(receiverId);
      if (!requester || !receiver) {
        throw new UserInputError("Invalid input");
      } else if (!receiver.requesterIds.includes(requesterId)) {
        await receiver.requesterIds.push(requesterId); // Add to receiver's requesterIds
        await receiver.save();
      }
      return receiver.requesterIds;
    },

    // Adds requesterId User to userId User's friend list, and vice versa ONLY if there was a request made
    async addFriend(_, { requesterId, userId }, context) {
      await userResolvers.Mutation.authenticateUserByContext(_, {}, context);

      const requester = await User.findById(requesterId);
      const user = await User.findById(userId);

      if (!requester || !user) {
        throw new UserInputError("Invalid input");
      } else if (
        !user.friendIds.includes(requesterId) &&
        !requester.friendIds.includes(userId) &&
        user.requesterIds.includes(requesterId)
      ) {
        // Remove requesterId from userId User
        var index = user.requesterIds.indexOf(requesterId);
        await user.requesterIds.splice(index, 1);
        await user.save();

        // Remove userId from requesterId's User if they also requested
        if (requester.requesterIds.includes(userId)) {
          index = requester.requesterIds.indexOf(userId);
          await requester.requesterIds.splice(index, 1);
          await requester.save();
        }

        // Add to friends
        await user.friendIds.push(requesterId);
        await requester.friendIds.push(userId);

        await user.save();
        await requester.save();
      }
      return user.friendIds;
    },

    // Removes userId User from friendId User's friend list and vice versa only if they are friends
    async removeFriend(_, { friendId, userId }, context) {
      await userResolvers.Mutation.authenticateUserByContext(_, {}, context);

      const friend = await User.findById(friendId);
      const user = await User.findById(userId);

      if (
        !friend ||
        !user ||
        !user.friendIds.includes(friendId) ||
        !friend.friendIds.includes(userId)
      ) {
        throw new UserInputError("Invalid input");
      } else {
        // Remove friend from list
        var index = user.friendIds.indexOf(friendId);
        await user.friendIds.splice(index, 1);
        await user.save();

        index = friend.friendIds.indexOf(userId);
        await friend.friendIds.splice(index, 1);
        await friend.save();

        return user.friendIds;
      }
    },
  },
};
