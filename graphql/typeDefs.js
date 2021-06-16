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
    getEventRecordingsByUser(userId: String!): [EventRecording]! # TODO: use this to get all eventrecordings... can get all urls w/in a group as well
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

    removeRecordingFromAWS(recordingUrl: String!): String # Delete individual url from AWS
    # TODO: allow the user to use the following mutation to delete an entire event recording group, with all its urls (they think it's just one recording...)
    deleteEventRecordingGroup(eventRecordingId: String!): String # Delete entire event recording group, with all its urls removed from AWS first
    deleteEventRecordingComponent(
      eventRecordingId: String!
      recordingUrl: String!
    ): String # Delete one url from event recording group, and remove it from AWS
    deleteEventRecording(eventRecordingId: String!): String # delete an event recording group, without removing its links from AWS
  }
`;
