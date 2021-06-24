const { gql } = require("apollo-server");

module.exports = gql`
  scalar DateTime

  # Admin user object, has access to certain mutations in the backend
  type Admin {
    id: String!

    name: String!
    password: String!
    email: String!

    createdAt: DateTime!
    token: String
  }

  # Regular user type, holds key information for all users relating to login, friends, panic keys and messages
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

  # Unused
  type File {
    filename: String!
    mimetype: String!
    encoding: String!
    url: String!
    createdAt: DateTime!
  }

  # Unused
  type S3Object {
    ETag: String
    Location: String!
    Key: String!
    Bucket: String!
  }

  # Type used to store detection phrases said by both Police or Thieves
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
    createdAt: DateTime!
  }

  # Used to store transcriptions and metadata like associated userId and a timestamp
  type Transcription {
    id: String!
    userId: String!
    latestTranscription: String!
    createdAt: DateTime!
  }

  # retrieve information
  type Query {
    getAdmin: Admin! # Get admin object of currently authenticated admin
    getAdminById(adminId: String!): Admin! # Get an admin object by id

    getUser: User! # Get user object of currently authenticated user
    getUsers: [User]! # Get all users in database
    getUserById(userId: String!): User! # Get user by specific user id

    # getEventRecordingTriggered(userId: String!): Boolean!
    getPoliceTokens: [String]! # Get an array of all police tokens in the database in string format
    getThiefTokens: [String]! # Get an array of all thief tokens in the database in string format
    getEventRecordingsByUser(userId: String!): [EventRecording]! # Retrieve an array of event recording groups by user id
    getUserMatches(name: String!): [User]! # Used in friend search system - searches all users in database with passed string in their name

    # user will search for another user by name (getUserMatches) and be
    # able to send any of the matches a friend request (sendFriendRequest - adds sender's userId to would-be-friend's requests)
    # users will be able to see their friendRequests (getFriendRequests) and add any of them (addFriend - add friend)

    getFriendRequests(userId: String!): [User]! # Get an array of user objects who the given user has sent friend requests to
    getFriends(userId: String!): [User]! # Get all friends of a given user, identified by their id

    getTranscriptionByUser(userId: String!): String! # With the given userId, returns the latest transcription from the user
  }

  # actions
  type Mutation {
    signupAdmin(
      name: String!
      email: String!
      password: String!
      confirmPassword: String!
    ): Admin! # Creates a new admin object with given arguments and saves it in the database

    loginAdmin(email: String!, password: String!): Admin! # Searches for an admin in the database with said credentials and returns that object
    deleteAdmin(adminId: String!): String # Removes an admin from the database, searching by adminId

    signupUser(
      name: String!
      email: String!
      password: String!
      confirmPassword: String!
    ): User! # Creates a user object with passed arguments and saves it to the database
    loginUser(email: String!, password: String!): User! # Returns a User object of the user who's credentials match the passed arguments
    deleteUser(userId: String!): String # Removes a User from the database with given userId

    setStartKey(userId: String!, startKey: String!): String # Start recording manually
    setPanicKey(userId: String!, panicKey: String!): String # Panic: stop recording, "send" the recording, call
    setStopKey(userId: String!, stopKey: String!): String # Stop the recording (other option is button)
    uploadCsFile(file: Upload!): S3Object! # Unused
    deleteCsFile(fileKey: String!): String! # Unused

    # Add url to EventRecording object
    addEventRecordingUrl(
      eventRecordingUrl: String!
      userId: String!
      finish: Boolean!
    ): [String]
    # transcribeEventRecording(recordingFileKey: String!): String!
    transcribeRecording(recordingBytes: String!): String!

    # getEventRecordingUrl(eventRecordingUrl: String!, userId: String!): [String]
    authenticateUserByContext: String
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

    setUserLocation(
      location: String!
      userId: String!
    ): String!

    toggleLocationOn(userId: String!): Boolean! # Returns boolean indicating whether location sharing is on or off after the mutation call
  }
`;
