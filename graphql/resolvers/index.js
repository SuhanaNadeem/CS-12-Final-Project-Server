const userResolvers = require("./users");
const recordingResolvers = require("./recordings");
const keyResolvers = require("./keys");
const flaggedTokenResolvers = require("./flaggedTokens");
const friendResolvers = require("./friends");
const transcriptionResolvers = require("./transcriptions");

const { GraphQLDateTime } = require("graphql-iso-date");

/* This file exports resolvers made to the server. */

module.exports = {
  DateTime: GraphQLDateTime,
  Query: {
    ...userResolvers.Query,
    ...recordingResolvers.Query,
    ...flaggedTokenResolvers.Query,
    ...friendResolvers.Query,
    ...transcriptionResolvers.Query,
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...recordingResolvers.Mutation,
    ...keyResolvers.Mutation,
    ...flaggedTokenResolvers.Mutation,
    ...friendResolvers.Mutation,
    ...transcriptionResolvers.Mutation,
  },
};
