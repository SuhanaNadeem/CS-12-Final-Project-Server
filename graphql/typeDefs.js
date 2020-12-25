const { gql } = require("apollo-server");

module.exports = gql`
  scalar DateTime

  type Admin {
    id: String!

    name: String
    password: String!
    email: String!

    createdAt: DateTime!
    token: String
  }
  type Mentor {
    id: String!
    name: String

    orgName: String
    password: String!
    email: String!

    createdAt: DateTime!
    token: String
  }

  type Student {
    id: String!

    orgName: String
    name: String
    password: String!
    email: String!

    inProgressModules: [String]
    completedModules: [String]
    badges: [String]

    createdAt: DateTime!
    token: String
  }

  type Module {
    id: String!
    type: String! # learn or practice
    category: String! # CAD, electrical, programming
    format: String # video or article | question type
    createdAt: DateTime!
  }

  type Badge {
    id: String!
    name: String!
    description: String
    createdAt: DateTime!
  }
  # not the card itself, just available templates
  type QuestionTemplate {
    id: String!
    type: String! # learn or practice
    category: String! # CAD, electrical, programming
    createdAt: DateTime!
  }

  type Question {
    id: String!
    image: String
    infoProvided: String!
    expectedAnswer: String
    createdAt: DateTime!
  }

  # retrieve information
  type Query {
    getAdmin: Admin!
    getMentor: Mentor!
    getStudent: Student!

    # for dashboard
    getCompletedModulesByStudent: [Module]!
    getInProgressModulesByStudent: [Module]!
    getBadgesByStudent: [Badge]!

    # for student's learn page
    getModulesByCategory(category: String!): [Module]!

    getStudentsByMentor: [Student]!
    getMentorsByStudent: [Mentor]!

    #  like dif form fields to create questions
    getQuestionTemplatesByCategory(category: String!): [QuestionTemplate]!

    # can be of any of the types
    getQuestionsByModule(module: String!): [Question]!

    # will either be ytvid link or gdoc hosted article link
    getLearnLinkByModule(module: String!): String!
  }

  # actions
  type Mutation {
    signupAdmin(
      email: String!
      password: String!
      confirmPassword: String!
    ): Admin!
    loginAdmin(email: String!, password: String!): Admin!

    signupMentor(
      email: String!
      password: String!
      confirmPassword: String!
    ): Mentor!
    loginMentor(email: String!, password: String!): Mentor!

    signupStudent(
      email: String!
      password: String!
      confirmPassword: String!
    ): Student!
    loginStudent(email: String!, password: String!): Student!

    addCompletedModule(moduleId: String!): [Module]
    addInProgressModule(moduleId: String!): [Module]
    addBadge(badgeId: String!): [Badge]

    # For admin
    createNewModule(category: String!): Module!
    createNewQuestion(
      moduleId: String!
      category: String!
      format: String
    ): Question!
    createNewQuestionTemplate(category: String!): QuestionTemplate!

    verifyAnswer(answer: String!): Boolean!
    starModule(moduleId: String!): Module!
    unstarModule(moduleId: String!): Module!
    starQuestion(questionId: String!): Question!
    unstarQuestion(questionId: String!): Question!

    incrementModulePoints(answerCorrect: Boolean!): Int!
  }
`;