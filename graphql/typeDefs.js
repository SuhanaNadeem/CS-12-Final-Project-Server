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

    uploadCsFile(file: Upload!): S3Object!
    deleteCsFile(fileKey: String!): String!

    # uploadRecordedFile(audioUri: String!): String!
    # # TODO: configure this properly so you can pass in URI to upload (ignore above function for now)
  }
`;
