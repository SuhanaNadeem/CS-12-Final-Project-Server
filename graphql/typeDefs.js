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

    startKey: String
    panicKey: String
    stopKey: String

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
  # TODO create a createPoliceTokens mutation that takes a String like "'arrest' 'get out' 'hands up'"
  # and creates a new FlaggedToken appropriately for each word/phrase enclosed in '' in that phrase
  # Do the same for createThiefTokens
  # See signupUser in users.js for how to make an object of a type
  type FlaggedToken {
    name: String! # "Police" or "Thief"
    token: String! # word or phrase
  }

  # The chunks of audio that make up an event are grouped here
  type EventRecording {
    id: String!
    eventRecordingUrls: [String]
    userId: String!
    finished: Boolean!
  }

  # retrieve information
  type Query {
    getAdmin: Admin!
    getAdminById(adminId: String!): Admin!

    getUser: User!
    getUsers: [User]!
    getUserById(userId: String!): User!

    # getEventRecordingTriggered(userId: String!): Boolean!
    getPoliceTokens: [String]!
    getThiefTokens: [String]!
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

    # Add url to EventRecording object
    addEventRecordingUrl(
      eventRecordingUrl: String!
      userId: String!
      finish: Boolean!
    ): [String]
    # transcribeEventRecording(recordingFileKey: String!): String!
    transcribeRecording(recordingBytes: String!): String!

    # getEventRecordingUrl(eventRecordingUrl: String!, userId: String!): [String]

    detectDanger(recordingBytes: String, userId: String!): String!
    handleDanger(
      recordingBytes: String
      userId: String!
      eventRecordingUrl: String
    ): String!

    # createEventRecording(
    #   newUserId: String!
    #   newEventRecordingUrls: [String]
    #   finished: Boolean
    # ): String

    matchStartTranscription(transcription: String!, userId: String!): String!
    matchStopTranscription(transcription: String!, userId: String!): String!

    createPoliceTokens(tokens: String!): [String]
    createThiefTokens(tokens: String!): [String]

    deletePoliceTokens(tokens: String!): Boolean!
    deleteThiefTokens(tokens: String!): Boolean!
  }
`;
