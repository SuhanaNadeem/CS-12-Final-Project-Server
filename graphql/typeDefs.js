const { gql } = require("apollo-server");

module.exports = gql`
  scalar DateTime

  # User type, holds key information for all users relating to login, friends, panic keys and messages
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

    location: String
    locationOn: Boolean

    friendIds: [String]
    requesterIds: [String]

    panicMessage: String
    panicPhone: String
  }

  # Used to store phrases commonly said by both police or thieves
  type FlaggedToken {
    name: String! # "Police" or "Thief"
    token: String! # word or phrase
  }

  # The chunks of audio that make up an event recording are grouped here
  type EventRecording {
    id: String!
    eventRecordingUrls: [String]
    userId: String!
    finished: Boolean!
    createdAt: DateTime!
  }

  # Used to store transcriptions for display and metadata like associated userId and a timestamp
  type Transcription {
    id: String!
    userId: String!
    latestTranscription: String!
    createdAt: DateTime!
  }

  # Queries retrieve information for the DB without making any changes
  type Query {
    getUser: User! # Get user object of currently authenticated user
    getUsers: [User]! # Get all users in database
    getUserById(userId: String!): User! # Get user by specific user id
    getPoliceTokens: [String]! # Get an array of all police tokens in the database in string format
    getThiefTokens: [String]! # Get an array of all thief tokens in the database in string format
    getEventRecordingsByUser(userId: String!): [EventRecording]! # Retrieve an array of event recording groups by user id
    getUserMatches(name: String!): [User]! # Used in friend search system - searches all users in database with passed string in their name
    getFriendRequests(userId: String!): [User]! # Get an array of user objects who the given user has sent friend requests to
    getFriends(userId: String!): [User]! # Get all friends of a given user, identified by their id
    getTranscriptionByUser(userId: String!): String! # With the given userId, returns the latest transcription from the user
  }

  # actions
  type Mutation {
    signupUser(
      name: String!
      email: String!
      password: String!
      confirmPassword: String!
    ): User! # Creates a User object with passed arguments and saves it to the database
    loginUser(email: String!, password: String!): User! # Returns a User object of the user whose credentials match the passed arguments
    deleteUser(userId: String!): String # Removes a User from the database with given userId
    setStartKey(userId: String!, startKey: String!): String # Store phrase that will allow user to verbally trigger an event recording
    setPanicKey(userId: String!, panicKey: String!): String # Store phrase that will allow user to verbally stop and send an alert text about an event recording
    setStopKey(userId: String!, stopKey: String!): String # Store phrase that will allow user to verbally stop an event recording
    removeAWSFile(fileKey: String!): String! # Delete a file stored in AWS bucket with filekey
    # Add URL to the latest EventRecording object
    addEventRecordingUrl(
      eventRecordingUrl: String!
      userId: String!
      finish: Boolean!
    ): [String]

    transcribeRecording(recordingBytes: String!): String!

    authenticateUserByContext: String
    detectDanger(recordingBytes: String, userId: String!): String!
    handleDanger(
      recordingBytes: String
      userId: String!
      eventRecordingUrl: String
    ): String!

    matchStartTranscription(transcription: String!, userId: String!): String!
    matchStopTranscription(transcription: String!, userId: String!): String!

    createPoliceTokens(tokens: String!): [String]
    createThiefTokens(tokens: String!): [String]

    deletePoliceTokens(tokens: String!): Boolean!
    deleteThiefTokens(tokens: String!): Boolean!

    # "Remove" refers to deleting from AWS. "Delete" refers to deleting from MongoDB.
    removeEventRecordingUrl(recordingUrl: String!): String # Remove individual url from AWS
    removeAndDeleteEventRecording(eventRecordingId: String!): String # Delete entire event recording group, with all its urls removed from AWS first
    removeAndDeleteEventRecordingUrl(
      eventRecordingId: String!
      recordingUrl: String!
    ): String # Delete one url from event recording group, and remove it from AWS
    deleteEventRecording(eventRecordingId: String!): String # delete an event recording group, without removing its links from AWS
    sendFriendRequest(requesterId: String!, receiverId: String!): [String]
    addFriend(userId: String!, requesterId: String!): [String]
    removeFriend(userId: String!, friendId: String!): [String]

    setMessageInfo(
      userId: String!
      newPanicMessage: String
      newPanicPhone: String
    ): User

    sendTwilioSMS(
      phoneNumber: String!
      message: String!
      eventRecordingUrl: String
    ): String!

    addToFinishedEventRecording(
      eventRecordingUrl: String!
      userId: String!
    ): [String]
    addToUnfinishedEventRecording(
      eventRecordingUrl: String!
      userId: String!
    ): [String]

    setTranscriptionByUser(userId: String!, transcription: String!): String

    matchToTokens(
      detected: String!
      name: String!
      transcription: String!
    ): String!

    setUserLocation(location: String!, userId: String!): String!

    toggleLocationOn(userId: String!): Boolean! # Returns boolean indicating whether location sharing is on or off after the mutation call
  }
`;
