const { gql } = require("apollo-server");

module.exports = gql`
  scalar DateTime

  type Admin {
    id: String!

    name: String!
    password: String!
    email: String!

    createdAt: DateTime!
    token: String
  }

  type User {
    id: String!

    name: String!
    password: String!
    email: String!

    eventRecordingUrls: [String]

    startKey: String
    panicKey: String
    stopKey: String

    eventRecordingTriggered: Boolean

    createdAt: DateTime!
    token: String
  }

  type File {
    filename: String!
    mimetype: String!
    encoding: String!
    url: String!
    createdAt: DateTime!
  }

  type S3Object {
    ETag: String
    Location: String!
    Key: String!
    Bucket: String!
  }
  # TODO understand this type... there are currently no objects of this type in the DB
  # TODO create a createPoliceTokens mutation that takes a String like "arrest out hands stop"
  # and creates a new FlaggedToken appropriately for each word in that phrase
  # Do the same for createThiefTokens
  # See signupUser.js for how to make an object of a type
  type FlaggedToken {
    name: String! # "Police" or "Thief"
    token: String! # word or phrase
  }

  # retrieve information
  type Query {
    getAdmin: Admin!
    getAdminById(adminId: String!): Admin!

    getUser: User!
    getUsers: [User]!
    getUserById(userId: String!): User!

    getEventRecordingTriggered(userId: String!): Boolean!
  }

  # actions
  type Mutation {
    signupAdmin(
      name: String!
      email: String!
      password: String!
      confirmPassword: String!
    ): Admin!
    loginAdmin(email: String!, password: String!): Admin!
    deleteAdmin(adminId: String!): String

    signupUser(
      name: String!
      email: String!
      password: String!
      confirmPassword: String!
    ): User!
    loginUser(email: String!, password: String!): User!
    deleteUser(userId: String!): String

    setStartKey(userId: String!, startKey: String!): String # Start recording manually
    setPanicKey(userId: String!, panicKey: String!): String # Panic: stop recording, "send" the recording, call
    setStopKey(userId: String!, stopKey: String!): String # Stop the recording (other option is button)
    uploadCsFile(file: Upload!): S3Object!
    deleteCsFile(fileKey: String!): String!

    addEventRecordingUrl(eventRecordingUrl: String!, userId: String!): [String]
    transcribeInterimRecording(interimRecordingFileKey: String!): String!
    getEventRecordingUrl(eventRecordingUrl: String!, userId: String!): [String]

    detectDanger(interimRecordingFileKey: String, userId: String!): Boolean!

    # toggleEventRecordingState(userId: String!): String

    matchTranscription(transcription: String!, userId: String!): Boolean!
  }
`;
