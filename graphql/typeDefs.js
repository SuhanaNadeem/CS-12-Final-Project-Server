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

  "THIS OBJECT IS DEPRECATED because url links to files are stored in stores, products, etc. Files store a url link to files uploaded to S3."
  type File {
    # "Unique identifier for the object."
    # id: String!
    "The file's name."
    filename: String!
    "The file extension."
    mimetype: String!
    "The encoding format."
    encoding: String!
    # "The S3 url of the file."
    url: String!
    # "The date and time when this file was created."
    createdAt: DateTime!
  }
  "This is a return type that helps in formatting the returns statements of file upload functions."
  type S3Object {
    ETag: String
    "The URL of the file."
    Location: String!
    Key: String!
    Bucket: String!
  }

  # retrieve information
  type Query {
    getAdmin: Admin! # done checked
    getAdminById(adminId: String!): Admin! # done checked
    getUser: User! # done checked
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
  }
`;
