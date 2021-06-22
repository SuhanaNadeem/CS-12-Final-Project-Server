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

    location: String # TODO: this is where you will store a user's location via a mutation (to be made) you call from the front end
    locationOn: Boolean

    friendIds: [String]
    requesterIds: [String]

    panicMessage: String
    panicPhone: String
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
    createdAt: DateTime!
  }

  type Transcription {
    id: String!
    userId: String!
    latestTranscription: String!
    createdAt: DateTime!
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
    getEventRecordingsByUser(userId: String!): [EventRecording]!
    getUserMatches(name: String!): [User]!

    # user will search for another user by name (getUserMatches) and be
    # able to send any of the matches a friend request (sendFriendRequest - adds sender's userId to would-be-friend's requests)
    # users will be able to see their friendRequests (getFriendRequests) and add any of them (addFriend - add friend)

    getFriendRequests(userId: String!): [User]!
    getFriends(userId: String!): [User]!

    getTranscriptionByUser(userId: String!): String!
    # TODO  query getFriendLocations should take userId, call getFriends, and for each friend from getFriends' returned array, check if locationOn is true. If so, add the location to a list, friendLocations. Return friendLocations.
    
    # TODO  query getUserLocation should return the user's location ONLY IF locationOn is true
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

    removeRecordingFromAWS(recordingUrl: String!): String # Delete individual url from AWS
    deleteEventRecordingGroup(eventRecordingId: String!): String # Delete entire event recording group, with all its urls removed from AWS first
    deleteEventRecordingComponent(
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

    # TODO create a mutation setUserLocation - to set the user location property to the location coords from the front end (hopefully a string argument works for that)
    setUserLocation(
      location: String!
      userId: String!
    ): String!

    # TODO toggleLocationOn should take a boolean from the front end with userId, setting user's locationOn attribute to true if the argument is false and true otherwise
    toggleLocationOn(userId: String!): Boolean! # Returns boolean indicating whether location sharing is on or off after the mutation call
  }
`;
