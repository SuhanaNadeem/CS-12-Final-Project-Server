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

    s3RecordingUrls: [String]

    startKey: String
    panicKey: String
    stopKey: String

    eventRecordingState: Boolean

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

  # retrieve information
  type Query {
    getAdmin: Admin!
    getAdminById(adminId: String!): Admin!

    getUser: User!
    getUsers: [User]!
    getUserById(userId: String!): User!

    getEventRecordingState(userId: String!): Boolean!
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
    toggleEventRecording(userId: String!): String

    # TODO need another button to start and stop - show that
    # TODO stop stream if recording is on
    # TODO make a page to set all the keys using these mutations
    # TODO text a link to the recording and make a call?
    # TODO share previously recorded audio file via text

    uploadCsFile(file: Upload!): S3Object!
    deleteCsFile(fileKey: String!): String!

    # uploadRecordedFile(audioUri: String!): String!

    addS3RecordingUrl(s3RecordingUrl: String!, userId: String!): [String]
    transcribeAudioChunk(s3AudioChunkUrl: String!, userId: String!): String!
  }
`;
