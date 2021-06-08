const adminResolvers = require("./admins");
const userResolvers = require("./users");
const audioResolvers = require("./recordings");
const keyResolvers = require("./keys");

const { GraphQLDateTime } = require("graphql-iso-date");

module.exports = {
  DateTime: GraphQLDateTime,
  Query: {
    ...adminResolvers.Query,
    ...userResolvers.Query,
    ...audioResolvers.Query,
    ...keyResolvers.Query,
  },
  Mutation: {
    ...adminResolvers.Mutation,
    ...userResolvers.Mutation,
    ...audioResolvers.Mutation,
    ...keyResolvers.Mutation,
  },
};
