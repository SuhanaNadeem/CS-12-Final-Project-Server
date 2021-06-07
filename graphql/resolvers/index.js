const adminResolvers = require("./admins");
const userResolvers = require("./users");
const audioResolvers = require("./audio");

const { GraphQLDateTime } = require("graphql-iso-date");

module.exports = {
  DateTime: GraphQLDateTime,
  Query: {
    ...adminResolvers.Query,
    ...userResolvers.Query,
    ...audioResolvers.Query,
  },
  Mutation: {
    ...adminResolvers.Mutation,
    ...userResolvers.Mutation,
    ...audioResolvers.Mutation,
  },
};
