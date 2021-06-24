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

    transcribeRecording(recordingBytes: String!): String! # Returns transcription of recording in string format
    authenticateUserByContext: String
    detectDanger(recordingBytes: String, userId: String!): String! # Indicates whether danger is detected; returns strings "start" or "stop" to trigger recording
    handleDanger(
      recordingBytes: String
      userId: String!
      eventRecordingUrl: String
    ): String! # Checks whether or not to stop recording after it has been started; returns strings "stop" or "panic"
    matchStartTranscription(transcription: String!, userId: String!): String! # Matches keywords to start recording (start key, police/thief tokens). Returns "start" or "stop"
    matchStopTranscription(transcription: String!, userId: String!): String! # Matches keywords to stop recording (stop/panic key). Returns "stop" or "panic"
    createPoliceTokens(tokens: String!): [String] # Creates a flaggedToken object with name: "Police" and given token and saves it to the database
    createThiefTokens(tokens: String!): [String] # Creates a flaggedToken object with name: "Thief" and given token and saves it to the database
    deletePoliceTokens(tokens: String!): Boolean! # Deletes all occurences of police tokens in database that have the given tokens. Returns true if any were removed, false otherwise
    deleteThiefTokens(tokens: String!): Boolean! # Deletes all occurences of thief tokens in database that have the given tokens. Returns true if any were removed, false otherwise
    # "Remove" refers to deleting from AWS. "Delete" refers to deleting from MongoDB.
    removeEventRecordingUrl(recordingUrl: String!): String # Remove individual url from AWS
    removeAndDeleteEventRecording(eventRecordingId: String!): String # Delete entire event recording group, with all its urls removed from AWS first
    removeAndDeleteEventRecordingUrl(
      eventRecordingId: String!
      recordingUrl: String!
    ): String # Delete one url from event recording group, and remove it from AWS
    deleteEventRecording(eventRecordingId: String!): String # delete an event recording group, without removing its links from AWS
    sendFriendRequest(requesterId: String!, receiverId: String!): [String] # Sends a friend request from the requesterId User to receiverId User
    addFriend(userId: String!, requesterId: String!): [String] # Adds requesterId User to userId User's friendlist, and vice versa ONLY if there was a request made
    removeFriend(userId: String!, friendId: String!): [String] # Removes userId User from friendId User's friendlist and vice versa only if they are friends
    setMessageInfo(
      userId: String!
      newPanicMessage: String
      newPanicPhone: String
    ): User # Updates the panic message information in the given userId's User object in the database, returns userId's User object
    sendTwilioSMS(
      phoneNumber: String!
      message: String!
      eventRecordingUrl: String
    ): String! # Sends an SMS message using Twilio, returns the message sent as a string
    addToFinishedEventRecording(
      eventRecordingUrl: String!
      userId: String!
    ): [String] # Adds an eventRecordingUrl to a finished eventRecording object, returns updated eventRecordingUrls of eventRecording object
    addToUnfinishedEventRecording(
      eventRecordingUrl: String!
      userId: String!
    ): [String] # Adds an eventRecordingUrl to an unfinished eventRecording object, returns updated eventRecordingUrls of eventRecording object
    setTranscriptionByUser(userId: String!, transcription: String!): String # Replaces a previous Transcription object associated with the given user or creates a new one with the given transcription
    matchToTokens(
      detected: String!
      name: String!
      transcription: String!
    ): String! # Matches flaggedToken objects associated with the given name to the given transcription. Returns whether to "start" or "stop" recording
    setUserLocation(location: String!, userId: String!): String! # Writes the strinigified JSON location string to the userId's User object. Returns given location string
    toggleLocationOn(userId: String!): Boolean! # Returns boolean indicating whether location sharing is on or off after the mutation call
  }
`;
