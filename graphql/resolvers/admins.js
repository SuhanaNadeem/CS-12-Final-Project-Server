const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { UserInputError, AuthenticationError } = require("apollo-server");

const {
  validateUserRegisterInput,
  validateUserLoginInput,
} = require("../../util/validators");
const SECRET_KEY = process.env.SECRET_ADMIN_KEY;
const Admin = require("../../models/Admin");
const Question = require("../../models/Question");
const QuestionTemplate = require("../../models/QuestionTemplate");
const Module = require("../../models/Module");
const Challenge = require("../../models/Challenge");
const Category = require("../../models/Category");

const checkAdminAuth = require("../../util/checkAdminAuth");
const StringStringDict = require("../../models/StringStringDict");
const Student = require("../../models/Student");
const StringIntDict = require("../../models/StringIntDict");
function generateToken(admin) {
  return jwt.sign(
    {
      id: admin.id,
      email: admin.email,
    },
    SECRET_KEY
  );
}

module.exports = {
  Query: {
    async getAdmin(_, {}, context) {
      try {
        const admin = checkAdminAuth(context);
        const targetAdmin = await Admin.findById(admin.id);
        return targetAdmin;
      } catch (error) {
        throw new AuthenticationError();
      }
    },
    async getAdmins(_, {}, context) {
      try {
        const admin = checkAdminAuth(context);
      } catch (error) {
        throw new AuthenticationError();
      }
      const admins = await Admin.find();
      if (!admins) {
        throw new UserInputError("invalid input");
      } else {
        return admins;
      }
    },
    async getStringStringDicts(_, {}, context) {
      try {
        const admin = checkAdminAuth(context);
      } catch (error) {
        throw new AuthenticationError();
      }
      const stringStringDicts = await StringStringDict.find();

      return stringStringDicts;
    },
    async getStringIntDicts(_, {}, context) {
      try {
        const admin = checkAdminAuth(context);
      } catch (error) {
        throw new AuthenticationError();
      }
      const stringIntDicts = await StringIntDict.find();

      return stringIntDicts;
    },
  },

  Mutation: {
    async signupAdmin(_, { name, email, password, confirmPassword }, context) {
      var { valid, errors } = validateUserRegisterInput(
        email,
        password,
        confirmPassword
      );
      if (!valid) {
        throw new UserInputError("Errors", { errors });
      }

      const checkAdmin = await Admin.findOne({ email });
      if (checkAdmin) {
        throw new UserInputError("Email already exists", {
          errors: {
            email: "An admin with this email already exists",
          },
        });
      }

      password = await bcrypt.hash(password, 12);

      const modules = [];
      const questionTemplates = [];
      const challenges = [];
      const categories = [];

      const newAdmin = new Admin({
        name,
        email,
        password,
        modules,
        questionTemplates,
        challenges,
        categories,
        createdAt: new Date(),
      });

      const res = await newAdmin.save();

      const token = generateToken(res);

      return { ...res._doc, id: res._id, token };
    },

    async loginAdmin(_, { email, password }, context) {
      const { errors, valid } = validateUserLoginInput(email, password);

      if (!valid) {
        throw new UserInputError("Errors", { errors });
      }

      const admin = await Admin.findOne({ email });

      if (!admin) {
        errors.email = "Admin not found";
        throw new UserInputError("Admin not found", {
          errors,
        });
      }

      const match = await bcrypt.compare(password, admin.password);

      if (!match) {
        errors.password = "Wrong credentials";
        throw new UserInputError("Wrong credentials", {
          errors,
        });
      }

      const token = generateToken(admin);
      return { ...admin._doc, id: admin._id, token };
    },

    async deleteAdmin(_, { adminId }, context) {
      try {
        var user = checkAdminAuth(context);
      } catch (error) {
        try {
          var user = checkMentorAuth(context);
        } catch (error) {
          throw new Error(error);
        }
      }
      const targetAdmin = await Admin.findById(adminId);
      if (targetAdmin) {
        await targetAdmin.delete();
        return "Delete Successful";
      } else {
        throw new UserInputError("Invalid input");
      }
    },

    async createNewQuestion(
      _,
      {
        image,
        hint,
        moduleId,
        questionDescription,
        expectedAnswer,
        questionTemplateId,
        points,
        videoLink,
        articleLink,
        skillDescription,
        questionName,
        type,
      },
      context
    ) {
      try {
        const admin = checkAdminAuth(context);
        var targetAdmin = await Admin.findById(admin.id);
      } catch (error) {
        throw new AuthenticationError();
      }
      if (!hint) {
        hint = "";
      }
      const targetQuestion = await Question.findOne({
        questionDescription,
      });
      const targetQuestionTemplate = await QuestionTemplate.findById(
        questionTemplateId
      );
      var targetModule = await Module.findById(moduleId);
      if (!targetQuestionTemplate || !targetModule) {
        throw new UserInputError("Invalid input");
      } else if (!targetQuestion) {
        const newQuestion = new Question({
          image,
          questionDescription,
          expectedAnswer,
          hint,
          questionTemplateId,
          points,
          moduleId,
          videoLink,
          articleLink,
          skillDescription,
          questionName,
          type,
          createdAt: new Date(),
        });
        await newQuestion.save();

        targetModule.questions.push(newQuestion.id);

        await targetModule.save();

        await targetAdmin.save();
        return newQuestion;
      } else {
        return targetQuestion;
      }
    },

    async createNewQuestionTemplate(
      _,
      { name, categoryId, inputFields },
      context
    ) {
      try {
        const admin = checkAdminAuth(context);
        var targetAdmin = await Admin.findById(admin.id);
      } catch (error) {
        throw new AuthenticationError();
      }

      const targetQuestionTemplate = await QuestionTemplate.findOne({
        name,
      });
      const targetCategory = await Category.findById(categoryId);

      if (!targetCategory) {
        throw new UserInputError("Invalid input");
      } else if (!targetQuestionTemplate) {
        const newQuestionTemplate = new QuestionTemplate({
          categoryId,
          name,
          inputFields,
          createdAt: new Date(),
        });

        await newQuestionTemplate.save();
        targetAdmin.questionTemplates.push(newQuestionTemplate.id);
        await targetAdmin.save();

        return newQuestionTemplate;
      } else {
        return targetQuestionTemplate;
      }
    },

    async createNewModule(_, { name, categoryId }, context) {
      try {
        const admin = checkAdminAuth(context);
        var targetAdmin = await Admin.findById(admin.id);
      } catch (error) {
        throw new AuthenticationError();
      }

      const targetModule = await Module.findOne({ name });

      const questions = [];
      const comments = [];

      const targetCategory = await Category.findById(categoryId);
      if (!targetCategory) {
        throw new UserInputError("Invalid input");
      } else if (!targetModule) {
        const newModule = new Module({
          name,
          categoryId,
          questions,
          comments,
          createdAt: new Date(),
        });

        await newModule.save();
        targetAdmin.modules.push(newModule.id);
        await targetAdmin.save();
        return newModule;
      } else {
        return targetModule;
      }
    },

    async createNewChallenge(
      _,
      { questionDescription, categoryId, image },
      context
    ) {
      try {
        const admin = checkAdminAuth(context);
        var targetAdmin = await Admin.findById(admin.id);
      } catch (error) {
        throw new AuthenticationError();
      }
      const targetChallenge = await Challenge.findOne({ questionDescription });
      const targetCategory = await Category.findById(categoryId);
      if (!targetCategory) {
        throw new UserInputError("Invalid input");
      } else if (!targetChallenge) {
        const newChallenge = new Challenge({
          questionDescription,
          categoryId,
          image,
          createdAt: new Date(),
        });

        await newChallenge.save();
        await targetAdmin.challenges.push(newChallenge.id);
        await targetAdmin.save();
        return newChallenge;
      } else {
        return targetChallenge;
      }
    },

    async createNewCategory(_, { name }, context) {
      try {
        const admin = checkAdminAuth(context);
        var targetAdmin = await Admin.findById(admin.id);
      } catch (error) {
        console.log(error);
        throw new AuthenticationError();
      }

      const targetCategory = await Category.findOne({ name });
      if (!targetCategory) {
        const newCategory = new Category({
          name,
          createdAt: new Date(),
        });
        await newCategory.save();
        targetAdmin.categories.push(newCategory.id);
        await targetAdmin.save();
        return newCategory;
      } else {
        return targetCategory;
      }
    },
    async editModule(_, { moduleId, newName, newCategoryId }, context) {
      try {
        const admin = checkAdminAuth(context);
        var targetAdmin = await Admin.findById(admin.id);
      } catch (error) {
        throw new AuthenticationError();
      }
      var targetModule = await Module.findById(moduleId);
      if (!targetModule) {
        throw new UserInputError("Invalid input");
      } else {
        targetModule.name = newName;
        targetModule.categoryId = newCategoryId;

        await targetModule.save();
        return targetModule;
      }
    },

    async editQuestion(
      _,
      {
        questionId,
        moduleId,
        newImage,
        newHint,
        newQuestionDescription,
        newExpectedAnswer,
        newModuleId,
        newPoints,
        newVideoLink,
        newArticleLink,
        newSkillDescription,
        newQuestionName,
        newType,
      },
      context
    ) {
      try {
        const admin = checkAdminAuth(context);
        var targetAdmin = await Admin.findById(admin.id);
      } catch (error) {
        throw new AuthenticationError();
      }
      var targetQuestion = await Question.findById(questionId);
      var currentModule = await Module.findById(moduleId);
      var newModule = await Module.findById(newModuleId);
      if (!targetQuestion || !currentModule || !newModule) {
        throw new UserInputError("Invalid input");
      } else {
        targetQuestion.image = newImage;
        targetQuestion.questionDescription = newQuestionDescription;
        targetQuestion.expectedAnswer = newExpectedAnswer;
        targetQuestion.hint = newHint;
        targetQuestion.points = newPoints;

        targetQuestion.videoLink = newVideoLink;
        targetQuestion.articleLink = newArticleLink;
        targetQuestion.type = newType;
        targetQuestion.skillDescription = newSkillDescription;
        targetQuestion.questionName = newQuestionName;

        if (newModuleId != moduleId) {
          const index = currentModule.questions.indexOf(questionId);
          currentModule.questions.splice(index, 1);
          await currentModule.save();
          await newModule.questions.push(questionId);
          await newModule.save();
          targetQuestion.moduleId = newModuleId;
        }
        await targetQuestion.save();
        return targetQuestion;
      }
    },

    async editQuestionTemplate(
      _,
      { questionTemplateId, newName, newCategoryId, newInputFields },
      context
    ) {
      try {
        const admin = checkAdminAuth(context);
        var targetAdmin = await Admin.findById(admin.id);
      } catch (error) {
        throw new AuthenticationError();
      }
      var targetQuestionTemplate = await QuestionTemplate.findById(
        questionTemplateId
      );
      if (!targetQuestionTemplate) {
        throw new UserInputError("Invalid input");
      } else {
        targetQuestionTemplate.categoryId = newCategoryId;
        targetQuestionTemplate.inputFields = newInputFields;
        targetQuestionTemplate.name = newName;

        await targetQuestionTemplate.save();
        return targetQuestionTemplate;
      }
    },

    async editChallenge(
      _,
      { challengeId, newCategoryId, newQuestionDescription, newImage },
      context
    ) {
      try {
        const admin = checkAdminAuth(context);
        var targetAdmin = await Admin.findById(admin.id);
      } catch (error) {
        throw new AuthenticationError();
      }
      var targetChallenge = await Challenge.findById(challengeId);
      if (!targetChallenge) {
        throw new UserInputError("Invalid input");
      } else {
        targetChallenge.categoryId = newCategoryId;
        targetChallenge.questionDescription = newQuestionDescription;
        targetChallenge.image = newImage;
        targetChallenge.categoryId = newCategoryId;

        await targetChallenge.save();
        return targetChallenge;
      }
    },
    async editCategory(_, { categoryId, newName }, context) {
      try {
        const admin = checkAdminAuth(context);
        var targetAdmin = await Admin.findById(admin.id);
      } catch (error) {
        throw new AuthenticationError();
      }
      var targetCategory = await Category.findById(categoryId);
      if (!targetCategory) {
        throw new UserInputError("Invalid input");
      } else {
        targetCategory.name = newName;
        await targetCategory.save();
        return targetCategory;
      }
    },
    async deleteModule(_, { moduleId }, context) {
      try {
        const admin = checkAdminAuth(context);
        var targetAdmin = await Admin.findById(admin.id);
      } catch (error) {
        throw new AuthenticationError();
      }
      const targetModule = await Module.findById(moduleId);
      if (!targetModule) {
        throw new UserInputError("Invalid input");
      } else {
        const index = targetAdmin.modules.indexOf(moduleId);
        targetAdmin.modules.splice(index, 1);
        await targetAdmin.save();
        await targetModule.delete();
        const updatedModules = targetAdmin.modules;
        return updatedModules;
      }
    },
    async deleteStringStringDict(_, { stringStringDictId }, context) {
      try {
        const admin = checkAdminAuth(context);
        var targetAdmin = await Admin.findById(admin.id);
      } catch (error) {
        throw new AuthenticationError();
      }
      const targetStringStringDict = await StringStringDict.findById(
        stringStringDictId
      );
      if (!targetStringStringDict) {
        throw new UserInputError("Invalid input");
      } else {
        var allStudents = await Student.find();
        allStudents.forEach(async function (targetStudent) {
          const index = targetStudent.quesAnsDict.indexOf({
            id: stringStringDictId,
          });
          targetStudent.quesAnsDict.splice(index, 1);
          await targetStudent.save();
        });
        await targetStringStringDict.delete();
        const updatedStringStringDicts = await StringStringDict.find();
        return updatedStringStringDicts;
      }
    },
    async deleteStringIntDict(_, { stringIntDictId }, context) {
      try {
        const admin = checkAdminAuth(context);
        var targetAdmin = await Admin.findById(admin.id);
      } catch (error) {
        throw new AuthenticationError();
      }
      const targetStringIntDict = await StringIntDict.findById(stringIntDictId);
      const moduleId = targetStringIntDict.key;
      if (!targetStringIntDict) {
        throw new UserInputError("Invalid input");
      } else {
        var allStudents = await Student.find();
        allStudents.forEach(async function (targetStudent) {
          const index1 = targetStudent.modulePointsDict.indexOf({
            id: stringIntDictId,
          });
          targetStudent.modulePointsDict.splice(index1, 1);
          await targetStudent.save();
          if (targetStudent.completedModules.includes(moduleId)) {
            const index2 = targetStudent.completedModules.indexOf(moduleId);
            targetStudent.completedModules.splice(index2, 1);
            await targetStudent.save();
          }
          if (targetStudent.inProgressModules.includes(moduleId)) {
            const index3 = targetStudent.inProgressModules.indexOf(moduleId);
            targetStudent.inProgressModules.splice(index3, 1);
            await targetStudent.save();
          }
        });

        await targetStringIntDict.delete();
        const updatedStringIntDicts = await StringIntDict.find();
        return updatedStringIntDicts;
      }
    },
    async deleteQuestion(_, { questionId }, context) {
      try {
        const admin = checkAdminAuth(context);
        var targetAdmin = await Admin.findById(admin.id);
      } catch (error) {
        throw new AuthenticationError();
      }
      const targetModule = await Module.findOne({ questions: questionId });
      const targetQuestion = await Question.findById(questionId);
      if (!targetQuestion || !targetModule) {
        throw new UserInputError("Invalid input");
      } else {
        const index = targetModule.questions.indexOf(questionId);
        targetModule.questions.splice(index, 1);
        await targetModule.save();
        await targetQuestion.delete();
        await targetModule.save();
        const updatedQuestions = await Question.find();
        console.log(targetModule.questions);
        return updatedQuestions;
      }
    },

    async deleteQuestionTemplate(_, { questionTemplateId }, context) {
      try {
        const admin = checkAdminAuth(context);
        var targetAdmin = await Admin.findById(admin.id);
      } catch (error) {
        throw new AuthenticationError();
      }
      const targetQuestionTemplate = await QuestionTemplate.findById(
        questionTemplateId
      );
      if (!targetQuestionTemplate) {
        throw new UserInputError("Invalid input");
      } else {
        const index = targetAdmin.questionTemplates.indexOf(questionTemplateId);
        targetAdmin.questionTemplates.splice(index, 1);
        await targetAdmin.save();
        await targetQuestionTemplate.delete();
        const updatedQuestionTemplates = targetAdmin.questionTemplates;
        return updatedQuestionTemplates;
      }
    },
    async deleteChallenge(_, { challengeId }, context) {
      try {
        const admin = checkAdminAuth(context);
        var targetAdmin = await Admin.findById(admin.id);
      } catch (error) {
        throw new AuthenticationError();
      }
      const targetChallenge = await Challenge.findById(challengeId);
      if (!targetChallenge) {
        throw new UserInputError("Invalid input");
      } else {
        const index = targetAdmin.challenges.indexOf(challengeId);
        targetAdmin.challenges.splice(index, 1);
        await targetAdmin.save();
        await targetChallenge.delete();
        const updatedChallenges = targetAdmin.challenges;
        return updatedChallenges;
      }
    },
    async deleteCategory(_, { categoryId }, context) {
      try {
        const admin = checkAdminAuth(context);
        var targetAdmin = await Admin.findById(admin.id);
      } catch (error) {
        console.log(error);
        throw new AuthenticationError();
      }
      const targetCategory = await Category.findById(categoryId);
      if (!targetCategory) {
        throw new UserInputError("Invalid input");
      } else {
        const index = targetAdmin.categories.indexOf(categoryId);
        targetAdmin.categories.splice(index, 1);
        await targetAdmin.save();
        await targetCategory.delete();
        const updatedCategories = targetAdmin.categories;
        return updatedCategories;

        // TODO delete AFTER
        //TODO Splice from admin  getcategories query and new = save
      }
    },
  },
};
