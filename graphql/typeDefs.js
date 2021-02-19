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

    questions: [String]
    badges: [String]

    createdAt: DateTime!
    token: String
  }
  type Mentor {
    id: String!
    name: String!

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

    inProgressModules: [String]
    completedModules: [String]
    badges: [String]
    starredModules: [String]
    starredQuestions: [String]

    completedQuestions: [String]
    completedSkills: [String]

    mentors: [String]

    quesAnsDict: [StringStringDict] # {questionsAttempted: submittedAnswers}
    modulePointsDict: [StringIntDict] # {studentId + module: points}
    createdAt: DateTime!
    token: String
  }

  type StringStringDict {
    id: String!
    key: String! # ques id
    value: String! # ans id
    studentId: String
    createdAt: DateTime!
  }

  type StringIntDict {
    id: String!
    key: String! # module id
    value: Int! # points
    studentId: String
    createdAt: DateTime!
  }

  type Module {
    id: String!
    name: String! # ASSUMING THIS IS UNIQUE
    categoryId: String!
    comments: [String]!
    questions: [String]!
    createdAt: DateTime!
    adminId: String
    learningObjectives: [String]
  }

  type Category {
    id: String!
    name: String! # CAD, elec, prog
    adminId: String

    createdAt: DateTime!
  }

  type Badge {
    id: String!
    name: String!
    image: String!
    description: String
    createdAt: DateTime!
    adminId: String
    criteria: String!
  }

  type Answer {
    id: String!
    answer: String!
    studentId: String!
    questionId: String!
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
    categoryId: String! # CAD, electrical, programming
    inputFields: [String]! # diff things you can enter
    adminId: String

    createdAt: DateTime!
  }
  type Question {
    id: String!
    type: String
    image: String
    questionName: String
    questionDescription: String! # ASSUMING THIS IS UNIQUE
    expectedAnswer: String
    createdAt: DateTime!
    hint: String
    questionTemplateId: String!
    points: Int
    moduleId: String
    videoLink: String
    articleLink: String
    adminId: String

    skillDescription: String
  }

  type Challenge {
    id: String!
    name: String
    image: String
    challengeDescription: String
    createdAt: DateTime!
    adminId: String

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
    getQuestionsByAdmin(adminId: String!): [Question]! # done checked
    getQuestionTemplatesByAdmin(adminId: String!): [QuestionTemplate]! # done checked
    getModulesByAdmin(adminId: String!): [Module]! # done checked
    getChallengesByAdmin(adminId: String!): [Challenge]! # done checked
    getBadgesByAdmin(adminId: String!): [Badge]! # done checked
    getCategoriesByAdmin(adminId: String!): [Category]! # done checked
    getMentor: Mentor! # done checked
    getMentors: [Mentor]! # done checked
    getStudent: Student! # done checked
    getStudentById(studentId: String!): Student! # done checked
    getStudents: [Student]! # done checked
    getBadges: [Badge]! # done checked
    getStringStringDicts: [StringStringDict]! # done checked
    getStringIntDicts: [StringIntDict]! # done checked
    # for dashboard
    getCompletedModulesByStudent: [Module]! # done checked
    getInProgressModulesByStudent: [Module]! # done checked
    getBadgesByStudent: [String]! # done checked
    getStudentsByMentor: [String]! # done checked
    getMentorsByStudent: [String]! # done checked
    getCategories: [Category]! # done checked
    getModuleById(moduleId: String!): Module! # done checked
    getCategoryById(categoryId: String!): Category! # done checked
    getQuestionById(questionId: String!): Question! # done checked
    getModules: [Module]! # done checked
    getChallenges: [Challenge]! # done checked
    getAnswersByStudent(studentId: String!): [Answer]! # done checked
    getAnswers: [Answer]! # done checked
    getQuestionTemplates: [QuestionTemplate]! # done checked
    getQuestions: [Question]! # done checked
    getComments: [Comment]! # done checked
    #  like dif form fields to create questions
    getQuestionTemplatesByCategory(categoryId: String!): [QuestionTemplate]! # done checked
    getChallengesByCategory(categoryId: String!): [Challenge]! # done checked
    # for student's learn page (categories.js)
    getModulesByCategory(categoryId: String!): [Module]! # done checked
    getIncompleteModulesByCategory(
      studentId: String!
      categoryId: String!
    ): [Module]! # done checked
    # can be of any of the types
    getQuestionsByModule(moduleId: String!): [String]! # done checked
    getCommentsByModule(moduleId: String!): [String]! # done checked
    getModulesBySearch(search: String!): [String]! # started
    getHintByQuestion(questionId: String!): String! # done checked
    getSavedAnswerByQuestion(questionId: String!, studentId: String!): String! # done checked
    getModulePointsByStudent(studentId: String!, moduleId: String!): Int # done checked
    getTotalPossibleModulePoints(moduleId: String!): Int # done checked
    getCompletedQuestionsByModule(
      moduleId: String!
      studentId: String!
    ): [String] # done checked
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
    deleteAdmin(adminId: String!): String # done checked
    signupMentor(
      email: String!
      name: String!
      password: String!
      confirmPassword: String!
    ): Mentor! # done checked
    loginMentor(email: String!, password: String!): Mentor! # done checked
    deleteMentor(mentorId: String!): String # done checked
    signupStudent(
      name: String!
      orgName: String!
      email: String!
      password: String!
      confirmPassword: String!
    ): Student! # done checked
    deleteStudent(studentId: String!): String # done checked
    loginStudent(email: String!, password: String!): Student! # done checked
    addCompletedModule(moduleId: String!, studentId: String!): [String] # done checked
    addInProgressModule(moduleId: String!, studentId: String!): [String] # done checked
    removeInProgressModule(moduleId: String!, studentId: String!): [String] # done checked
    removeCompletedModule(moduleId: String!, studentId: String!): [String] # done checked
    addBadge(badgeId: String!): [String] # done checked
    addMentor(mentorId: String!): [String] # done checked
    # For admin
    createNewModule(name: String!, categoryId: String!): Module! # done checked
    createNewBadge(
      name: String!
      image: String!
      description: String!
      criteria: String
    ): Badge! # done checked
    createNewQuestion(
      image: String
      moduleId: String!
      questionDescription: String!
      expectedAnswer: String
      hint: String
      questionTemplateId: String!
      points: Int
      videoLink: String
      articleLink: String
      skillDescription: String
      questionName: String
      type: String
    ): Question! # done checked
    createNewQuestionTemplate(
      name: String!
      categoryId: String!
      inputFields: [String]!
    ): QuestionTemplate! # done checked
    editModule(
      moduleId: String!
      newName: String
      newCategoryId: String
      newAdminId: String
    ): Module! # done checked
    editBadge(
      badgeId: String!
      newName: String
      newImage: String
      newCriteria: String
      newDescription: String
      newAdminId: String
    ): Badge! # done checked
    editQuestion(
      questionId: String!
      moduleId: String!
      newModuleId: String
      newImage: String
      newQuestionDescription: String
      newHint: String
      newExpectedAnswer: String
      newPoints: Int
      newVideoLink: String
      newArticleLink: String
      newSkillDescription: String
      newQuestionName: String
      newType: String
      newAdminId: String
    ): Question! # done checked
    editQuestionTemplate(
      newName: String
      questionTemplateId: String!
      newCategoryId: String
      newInputFields: [String]
      newAdminId: String
    ): QuestionTemplate! # done checked
    deleteStringStringDict(stringStringDictId: String!): [StringStringDict]! # done checked
    deleteStringIntDict(stringIntDictId: String!): [StringIntDict]! # done checked
    deleteModule(moduleId: String!): [String]! # done checked
    deleteBadge(badgeId: String!): [Badge]! # done checked
    deleteQuestion(questionId: String!): [Question]! # done checked
    deleteAnswer(answerId: String!, studentId: String!): String! # done checked
    deleteQuestionTemplate(questionTemplateId: String!): [String]! # done checked
    createNewCategory(name: String!): Category! # done checked
    editCategory(
      categoryId: String!
      newName: String
      newAdminId: String
    ): Category! # done checked
    deleteCategory(categoryId: String!): [String]! # done checked
    createNewChallenge(
      name: String
      categoryId: String!
      challengeDescription: String
      image: String
    ): Challenge! # done checked
    editChallenge(
      challengeId: String!
      newCategoryId: String
      newChallengeDescription: String
      newName: String
      newImage: String
      newAdminId: String
    ): Challenge! # done checked
    deleteChallenge(challengeId: String!): [String]! # done checked
    # createHint(questionId: String!, hintDescription: String!): Hint! # done
    # editHint(hintId: String!, newHintDescription: String!): Hint! # done
    # deleteHint(questionId: String!, hintId: String!): Question! # done
    # for learn/practice experience
    startQuestion(questionId: String!, studentId: String!): StringStringDict! # done checked
    startModule(moduleId: String!, studentId: String!): StringIntDict! # done checked
    saveAnswer(
      answer: String!
      questionId: String!
      studentId: String!
    ): Answer! # done checked
    verifyAnswer(
      answerId: String!
      questionId: String!
      studentId: String!
    ): Boolean! # done checked
    starModule(moduleId: String!): [String]! # done checked
    unstarModule(moduleId: String!): [String]! # done checked
    starQuestion(questionId: String!): [String]! # done checked
    unstarQuestion(questionId: String!): [String]! # done checked
    createNewComment(moduleId: String!, comment: String): Module # done checked
    deleteComment(moduleId: String!, commentId: String): Module # done checked
    incrementModulePoints(
      moduleId: String!
      answerCorrect: Boolean!
      numToIncrement: Int!
      studentId: String!
    ): Int! # done checked
    decrementModulePoints(
      moduleId: String!
      numToDecrement: Int!
      studentId: String!
    ): Int! # done checked
    handleAnswerPoints(
      answer: String
      studentId: String!
      questionId: String!
    ): Int! # done checked
    handleStarQuestion(questionId: String!): [String] # done checked
    handleStarModule(moduleId: String!): [String] # done checked
  }
  # TODO giveBadgeToStudent, editStudent, editMentor, editAdmin
`;
