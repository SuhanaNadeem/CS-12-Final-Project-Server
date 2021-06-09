const adminResolvers = require("./admins");
const userResolvers = require("./users");
const recordingResolvers = require("./recordings");
const keyResolvers = require("./keys");

const { GraphQLDateTime } = require("graphql-iso-date");

module.exports = {
  DateTime: GraphQLDateTime,
  Query: {
    ...adminResolvers.Query,
    ...userResolvers.Query,
    ...recordingResolvers.Query,
    ...keyResolvers.Query,
  },
  Mutation: {
    ...adminResolvers.Mutation,
    ...userResolvers.Mutation,
    ...recordingResolvers.Mutation,
    ...keyResolvers.Mutation,
  },
};
