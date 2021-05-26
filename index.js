require("dotenv").config();

const { ApolloServer, PubSub } = require("apollo-server");

const mongoose = require("mongoose");

const typeDefs = require("./graphql/typeDefs");
const resolvers = require("./graphql/resolvers");

const pubsub = new PubSub();

const PORT = process.env.PORT || 5000;

const server = new ApolloServer({
  typeDefs,
  resolvers,

  introspection: true,
  playground: true,
  context: ({ req, connection }) => ({ req, connection, pubsub }),

  subscriptions: { path: "/subscriptions" },
});
// console.log(process.env.MONGODB);
mongoose
  .connect(process.env.MONGODB, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    // console.log("MongoDB Connected");
    return server.listen({ port: PORT });
  })
  .then(({ url, subscriptionsUrl }) => {
    // console.log(`🚀 Server ready at ${url}`);
    // console.log(`🚀 Subscription ready at ${subscriptionsUrl}`);
  })
  .catch((err) => {
    console.error(err);
  });
