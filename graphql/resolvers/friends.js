const { UserInputError, AuthenticationError } = require("apollo-server");

const SECRET_KEY = process.env.SECRET_USER_KEY;

const {
  validateUserRegisterInput,
  validateUserLoginInput,
} = require("../../util/validators");
const User = require("../../models/User");

const checkUserAuth = require("../../util/checkUserAuth");
const userResolvers = require("./users");

module.exports = {
  Query: {
    async getUserMatches(_, { name }, context) {
      console.log("enters user matches");
      console.log("search query: " + name);
      try {
        var user = checkUserAuth(context);
      } catch (error) {
        throw new AuthenticationError(error);
      }

      var agg = [
        {
          $match: {
            $text: { $search: name },
          },
        },
      ];

      const users = await User.aggregate(agg);

      // console.log("users:");
      // console.log(users);
      const matchedUsers = []; // Need to get entire objects
      for (var user of users) {
        user = await User.findById(user._id);
        matchedUsers.push(user);
      }
      return matchedUsers;
    },

    async getFriendRequests(_, { userId }, context) {
      console.log("enters getFriendRequests");
      await userResolvers.Mutation.authenticateUserByContext(_, {}, context);
      console.log(userId);
      const targetUser = await User.findById(userId);

      if (!targetUser) {
        throw new UserInputError("Invalid input ");
      } else if (targetUser.requesterIds.length != 0) {
        console.log("in here 2");
        var requester;
        var requesters = [];
        for (var requesterId of targetUser.requesterIds) {
          requester = await User.findById(requesterId);
          requesters.push(requester);
        }
        return requesters;
      }

      return [];
    },
    async getFriends(_, { userId }, context) {
      console.log("enters getFriends");
      await userResolvers.Mutation.authenticateUserByContext(_, {}, context);
      console.log(userId);
      const targetUser = await User.findById(userId);

      if (!targetUser) {
        throw new UserInputError("Invalid input ");
      } else if (targetUser.friendIds.length != 0) {
        var friend;
        var friends = [];
        for (var friendId of targetUser.friendIds) {
          friend = await User.findById(friendId);
          friends.push(friend);
        }
        return friends;
      }

      return [];
    },
  },
  Mutation: {
    async sendFriendRequest(_, { requesterId, receiverId }, context) {
      console.log("enters sendFriendRequest");
      console.log("requester: " + requesterId);
      console.log("receiver: " + receiverId);
      try {
        var user = checkUserAuth(context);
      } catch (error) {
        throw new Error(error);
      }
      console.log(1);
      const requester = await User.findById(requesterId);
      const receiver = await User.findById(receiverId);
      console.log(2);
      if (!requester || !receiver) {
        throw new UserInputError("Invalid input");
      } else if (!receiver.requesterIds.includes(requesterId)) {
        console.log(3);
        await receiver.requesterIds.push(requesterId);

        await receiver.save();
        console.log(4);
      }
      console.log(receiver.requesterIds);
      return receiver.requesterIds;
    },
    async addFriend(_, { requesterId, userId }, context) {
      console.log("enters addFriend");
      console.log("requester: " + requesterId);
      console.log("receiver: " + userId);
      try {
        checkUserAuth(context);
      } catch (error) {
        throw new Error(error);
      }
      console.log(1);
      const requester = await User.findById(requesterId);
      const user = await User.findById(userId);
      console.log(2);
      if (!requester || !user) {
        throw new UserInputError("Invalid input");
      } else if (
        !user.friendIds.includes(requesterId) &&
        !requester.friendIds.includes(userId) &&
        user.requesterIds.includes(requesterId)
      ) {
        console.log(3);
        var index = user.requesterIds.indexOf(requesterId);
        await user.requesterIds.splice(index, 1);
        await user.save();

        if (requester.requesterIds.includes(userId)) {
          index = requester.requesterIds.indexOf(userId);
          await requester.requesterIds.splice(index, 1);
          await requester.save();
        }

        await user.friendIds.push(requesterId);
        await requester.friendIds.push(userId);

        await user.save();
        await requester.save();

        console.log(4);
      }
      console.log(user.friendIds);

      return user.friendIds;
    },

    async removeFriend(_, { friendId, userId }, context) {
      console.log("enters removeFriend");
      console.log("friend: " + friendId);
      console.log("receiver: " + userId);
      try {
        checkUserAuth(context);
      } catch (error) {
        throw new Error(error);
      }
      console.log(1);
      const friend = await User.findById(friendId);
      const user = await User.findById(userId);
      console.log(2);
      if (
        !friend ||
        !user ||
        !user.friendIds.includes(friendId) ||
        !friend.friendIds.includes(userId)
      ) {
        throw new UserInputError("Invalid input");
      } else {
        var index = user.friendIds.indexOf(friendId);
        await user.friendIds.splice(index, 1);
        await user.save();

        index = friend.friendIds.indexOf(userId);
        await friend.friendIds.splice(index, 1);
        await friend.save();

        console.log(user.friendIds);
        console.log(friend.friendIds);
        return user.friendIds;
      }
    },
  },
};
