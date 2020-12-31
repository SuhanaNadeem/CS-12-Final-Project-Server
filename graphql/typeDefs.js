const { gql } = require("apollo-server");

module.exports = gql`
  scalar DateTime

  type Admin {
    id: String!

    name: String!
    password: String!
    email: String!

    modules: [String]!
    questionTemplates: [String]!
    challenges: [String]!
    categories: [String]!

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

    orgName: String!
    name: String!
    password: String!
    email: String!

    inProgressModules: [String]!
    completedModules: [String]!
    badges: [String]!
    starredModules: [String]!
    starredQuestions: [String]!

    mentors: [String]!

    quesAnsDict: [StringStringDict]! # {questionsAttempted: submittedAnswers}
    modulePointsDict: [StringIntDict]! # {module: points}
    createdAt: DateTime!
    token: String
  }

  type StringStringDict {
    key: String! # ques id
    value: String! # ans id
    createdAt: DateTime!
  }

  type StringIntDict {
    key: String! # module id
    value: Int! # points
    createdAt: DateTime!
  }

  type Module {
    id: String!
    name: String! # ASSUMING THIS IS UNIQUE
    categoryId: String!
    format: String! # video or article | question type
    comments: [String]!
    questions: [String]!
    createdAt: DateTime!
  }

  type Category {
    id: String!
    name: String! # CAD, elec, prog
    createdAt: DateTime!
  }

  type Badge {
    id: String!
    name: String!
    description: String
    createdAt: DateTime!
    criteria: String!
  }

  type Answer {
    id: String!
    answer: String!
    studentId: String!
    questionId: String!
    categoryId: String!
    moduleId: String!
    createdAt: DateTime!
  }

  # type Hint {
  #   id: String!
  #   questionId: String!
  #   hintDescription: String!
  #   createdAt: DateTime!
  # }

  # not the card itself, just available templates
  type QuestionTemplate {
    id: String!
    name: String!
    type: String! # learn or practice
    categoryId: String! # CAD, electrical, programming
    inputFields: [String]! # diff things you can enter
    hint: String
    createdAt: DateTime!
  }

  type Question {
    id: String!
    image: String
    questionDescription: String! # ASSUMING THIS IS UNIQUE
    expectedAnswers: [String]
    createdAt: DateTime!
    hint: String
    questionTemplateId: String!
  }

  type Challenge {
    id: String!
    image: String
    questionDescription: String!
    createdAt: DateTime!
    categoryId: String!
  }

  type Comment {
    id: String!
    comment: String!
    moduleId: String!
    createdAt: DateTime!
    personId: String!
  }

  # retrieve information
  type Query {
    getAdmin: Admin! # done checked
    getAdmins: [Admin]! # done checked
    getMentor: Mentor! # done checked
    getMentors: [Mentor]! # done checked
    getStudent: Student! # done checked
    getStudents: [Student]! # done checked
    # for dashboard
    getCompletedModulesByStudent: [String]! # done
    getInProgressModulesByStudent: [String]! # done
    getBadgesByStudent: [String]! # done
    getStudentsByMentor: [Student]! # done
    getMentorsByStudent: [String]! # done
    getCategories: [Category]! # done checked
    getModules: [Module]! # done checked
    getChallenges: [Challenge]! # done checked
    getQuestionTemplates: [QuestionTemplate]! # done checked
    getQuestions: [Question]! # done
    getComments: [Comment]! # done
    #  like dif form fields to create questions
    getQuestionTemplatesByCategory(categoryId: String!): [QuestionTemplate]! # done checked
    getChallengesByCategory(categoryId: String!): [Challenge]! # done checked
    # for student's learn page (categories.js)
    getModulesByCategory(categoryId: String!): [Module]! # done checked
    # can be of any of the types
    getQuestionsByModule(moduleId: String!): [String]! # done checked
    getCommentsByModule(moduleId: String!): [String]! # done
    getModulesBySearch(search: String!): [String]! # started
    getHintByQuestion(questionId: String!): String! # done
    getSavedAnswerByQuestion(questionId: String!): [String]! # done
  }

  # actions
  type Mutation {
    signupAdmin(
      name: String!
      email: String!
      password: String!
      confirmPassword: String!
    ): Admin! # done checked
    loginAdmin(email: String!, password: String!): Admin! # done checked
    deleteAdmin(adminId: String!): String # done
    signupMentor(
      email: String!
      password: String!
      confirmPassword: String!
    ): Mentor! # done
    loginMentor(email: String!, password: String!): Mentor! # done checked
    deleteMentor(mentorId: String!): String # done
    signupStudent(
      name: String!
      orgName: String!
      email: String!
      password: String!
      confirmPassword: String!
    ): Student! # done checked
    deleteStudent(studentId: String!): String # done
    loginStudent(email: String!, password: String!): Student! # done checked
    addCompletedModule(moduleId: String!): [String] # done
    addInProgressModule(moduleId: String!): [String] # done
    addBadge(badgeId: String!): [String] # done
    # For admin
    createNewModule(name: String!, categoryId: String!, format: String): Module! # done checked
    createNewQuestion(
      image: String!
      moduleId: String!
      questionDescription: String!
      expectedAnswers: [String]
      hint: String!
      questionTemplateId: String!
    ): Question! # done checked
    createNewQuestionTemplate(
      name: String!
      categoryId: String!
      inputFields: [String]!
      type: String!
    ): QuestionTemplate! # done checked
    editModule(
      moduleId: String!
      newName: String!
      newCategoryId: String!
      newFormat: String!
    ): Module! # done checked
    editQuestion(
      questionId: String!
      moduleId: String!
      newModuleId: String!
      newImage: String!
      newQuestionDescription: String!
      newHint: String!
      newExpectedAnswers: [String]
    ): Question! # done checked
    editQuestionTemplate(
      newName: String!
      questionTemplateId: String!
      newCategoryId: String!
      newInputFields: [String]!
      newType: String!
    ): QuestionTemplate! # done checked
    deleteModule(moduleId: String!): [String]! # done checked
    deleteQuestion(questionId: String!): [String]! # done checked
    deleteQuestionTemplate(questionTemplateId: String!): [String]! # done checked
    createNewCategory(name: String!): Category! # done checked
    editCategory(categoryId: String!, newName: String!): Category! # done checked
    deleteCategory(categoryId: String!): [String]! # done checked
    createNewChallenge(
      categoryId: String!
      questionDescription: String!
      image: String
    ): Challenge! # done checked
    editChallenge(
      challengeId: String!
      newCategoryId: String!
      newQuestionDescription: String!
      newImage: String
    ): Challenge! # done checked
    deleteChallenge(challengeId: String!): [String]! # done checked
    # createHint(questionId: String!, hintDescription: String!): Hint! # done
    # editHint(hintId: String!, newHintDescription: String!): Hint! # done
    # deleteHint(questionId: String!, hintId: String!): Question! # done
    # for learn/practice experience
    submitAnswer(
      answer: String!
      categoryId: String!
      questionId: String!
      moduleId: String!
      studentId: String!
    ): Answer! # done
    verifyAnswer(answerId: String!, questionId: String!): Boolean! # done
    starModule(moduleId: String!): [String]! # done
    unstarModule(moduleId: String!): [String]! # done
    starQuestion(questionId: String!): [String]! # done
    unstarQuestion(questionId: String!): [String]! # done
    createNewComment(moduleId: String!, comment: String): Module # done checked
    deleteComment(moduleId: String!, commentId: String): Module # done
    incrementModulePoints(
      moduleId: String!
      answerCorrect: Boolean!
      numToIncrement: Int!
    ): Int! # done
  }
`;
