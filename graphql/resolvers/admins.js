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
const Badge = require("../../models/Badge");
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
    async getAdminById(_, { adminId }, context) {
      try {
        const admin = checkAdminAuth(context);
      } catch (error) {
        try {
          const mentor = checkMentorAuth(context);
        } catch (error) {
          throw new AuthenticationError();
        }
      }
      const targetAdmin = await Admin.findById(adminId);
      if (!targetAdmin) {
        throw new UserInputError("Invalid input");
      } else {
        return targetAdmin;
      }
    },

    async getQuestionsByAdmin(_, { adminId }, context) {
      try {
        const admin = checkAdminAuth(context);
      } catch (error) {
        throw new AuthenticationError();
      }
      const admin = await Admin.findById(adminId);
      const questions = await Question.find({ adminId });
      if (!admin) {
        throw new UserInputError("invalid input");
      } else {
        return questions;
      }
    },
    async getQuestionTemplatesByAdmin(_, { adminId }, context) {
      try {
        const admin = checkAdminAuth(context);
      } catch (error) {
        throw new AuthenticationError();
      }
      const admin = await Admin.findById(adminId);
      const questionTemplates = await QuestionTemplate.find({ adminId });
      if (!admin) {
        throw new UserInputError("invalid input");
      } else {
        return questionTemplates;
      }
    },
    async getBadgesByAdmin(_, { adminId }, context) {
      try {
        const admin = checkAdminAuth(context);
      } catch (error) {
        throw new AuthenticationError();
      }
      const admin = await Admin.findById(adminId);
      var badges = await Badge.find({ adminId });

      if (!admin) {
        throw new UserInputError("invalid input");
      } else {
        return badges;
      }
    },
    async getModulesByAdmin(_, { adminId }, context) {
      try {
        const admin = checkAdminAuth(context);
      } catch (error) {
        throw new AuthenticationError();
      }
      const admin = await Admin.findById(adminId);
      const modules = await Module.find({ adminId });
      if (!admin) {
        throw new UserInputError("invalid input");
      } else {
        return modules;
      }
    },
    async getCategoriesByAdmin(_, { adminId }, context) {
      try {
        const admin = checkAdminAuth(context);
      } catch (error) {
        throw new AuthenticationError();
      }
      const admin = await Admin.findById(adminId);
      const categories = await Category.find({ adminId });
      if (!admin) {
        throw new UserInputError("invalid input");
      } else {
        return categories;
      }
    },
    async getChallengesByAdmin(_, { adminId }, context) {
      try {
        const admin = checkAdminAuth(context);
      } catch (error) {
        throw new AuthenticationError();
      }
      const admin = await Admin.findById(adminId);
      const challenges = await Challenge.find({ adminId });
      if (!admin) {
        throw new UserInputError("invalid input");
      } else {
        return challenges;
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

      const newAdmin = new Admin({
        name,
        email,
        password,
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
          throw new AuthenticationError(error);
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
        questionFormat,
        points,
        videoLink,
        articleLink,
        skillDescription,
        questionName,
        type,
        extraLink,
        optionA,
        optionB,
        optionC,
        optionD,
      },
      context
    ) {
      try {
        const admin = checkAdminAuth(context);
        var targetAdmin = await Admin.findById(admin.id);
      } catch (error) {
        throw new AuthenticationError();
      }

      const targetQuestion = await Question.findOne({
        questionDescription,
      });

      var targetModule = await Module.findById(moduleId);
      if (
        !targetModule ||
        (type === "Question" && (!questionFormat || questionFormat === "")) ||
        (questionFormat === "Multiple Choice" &&
          (optionA === "" ||
            !optionA ||
            optionB === "" ||
            !optionB ||
            optionC === "" ||
            !optionC ||
            optionD === "" ||
            !optionD ||
            (expectedAnswer !== "A" &&
              expectedAnswer !== "B" &&
              expectedAnswer !== "C" &&
              expectedAnswer !== "D")))
      ) {
        throw new UserInputError("Invalid input");
      } else if (!targetQuestion) {
        const newQuestion = new Question({
          image,
          questionDescription,
          expectedAnswer,
          hint,
          questionFormat,
          points,
          moduleId,
          videoLink,
          articleLink,
          skillDescription,
          questionName,
          type,
          adminId: targetAdmin.id,
          extraLink,
          optionA,
          optionB,
          optionC,
          optionD,
          createdAt: new Date(),
        });
        await newQuestion.save();

        targetModule.questions.push(newQuestion.id);
        await targetModule.save();

        // targetAdmin.questions.push(newQuestion.id);
        // await targetAdmin.save();

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
          adminId: targetAdmin.id,
          createdAt: new Date(),
        });

        await newQuestionTemplate.save();

        // targetAdmin.questionTemplates.push(newQuestionTemplate.id);
        // await targetAdmin.save();

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
          adminId: targetAdmin.id,
          createdAt: new Date(),
        });

        await newModule.save();
        // targetAdmin.modules.push(newModule.id);
        // await targetAdmin.save();
        return newModule;
      } else {
        return targetModule;
      }
    },

    async createNewChallenge(
      _,
      { name, challengeDescription, categoryId, image },
      context
    ) {
      try {
        const admin = checkAdminAuth(context);
        var targetAdmin = await Admin.findById(admin.id);
      } catch (error) {
        throw new AuthenticationError();
      }
      const targetChallenge = await Challenge.findOne({ challengeDescription });
      const targetCategory = await Category.findById(categoryId);
      if (!targetCategory) {
        throw new UserInputError("Invalid input");
      } else if (!targetChallenge) {
        const newChallenge = new Challenge({
          name,
          challengeDescription,
          categoryId,
          image,
          adminId: targetAdmin.id,
          createdAt: new Date(),
        });

        await newChallenge.save();
        // await targetAdmin.challenges.push(newChallenge.id);
        // await targetAdmin.save();
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
          adminId: targetAdmin.id,
          createdAt: new Date(),
        });
        await newCategory.save();
        // targetAdmin.categories.push(newCategory.id);
        // await targetAdmin.save();
        return newCategory;
      } else {
        return targetCategory;
      }
    },
    async editModule(
      _,
      { moduleId, newName, newCategoryId, newAdminId },
      context
    ) {
      try {
        const admin = checkAdminAuth(context);
        var targetAdmin = await Admin.findById(admin.id);
      } catch (error) {
        throw new AuthenticationError();
      }
      var targetModule = await Module.findById(moduleId);
      var newNameModule = await Module.findOne({
        name: newName,
      });
      var newCategory = await Category.findById(newCategoryId);
      var newAdmin = await Admin.findById(newAdminId);

      if (
        !targetModule ||
        (newName !== undefined &&
          newName !== targetModule.name &&
          newNameModule) ||
        (newCategoryId !== undefined &&
          newCategoryId !== targetModule.categoryId &&
          !newCategory) ||
        (newAdminId !== undefined &&
          newAdminId !== targetModule.adminId &&
          !newAdmin)
      ) {
        throw new UserInputError("Invalid input");
      } else {
        if (newName !== undefined) {
          targetModule.name = newName;
        }
        if (newCategoryId !== undefined) {
          targetModule.categoryId = newCategoryId;
        }
        if (newAdminId !== undefined) {
          targetModule.adminId = newAdminId;
        }

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
        newAdminId,
        newExtraLink,
        newOptionA,
        newOptionB,
        newOptionC,
        newOptionD,
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
      // var targetQuestionTemplate = await QuestionTemplate.findById(
      //   targetQuestion.questionTemplateId
      // );

      var currentModule = await Module.findById(moduleId);
      var newModule = await Module.findById(newModuleId);
      var newNameQuestion = await Question.findOne({
        questionName: newQuestionName,
      });
      var newDescriptionQuestion = await Question.findOne({
        questionDescription: newQuestionDescription,
      });
      var newAdmin = await Admin.findById(newAdminId);

      if (
        !targetQuestion ||
        !currentModule ||
        (newQuestionName !== undefined &&
          newQuestionName !== "" &&
          newQuestionName !== targetQuestion.name &&
          newNameQuestion) === true ||
        (newQuestionDescription !== undefined &&
          newQuestionDescription !== "" &&
          newQuestionDescription !== targetQuestion.questionDescription &&
          newDescriptionQuestion) === true ||
        (newAdminId !== undefined &&
          newAdminId !== "" &&
          newAdminId !== targetQuestion.adminId &&
          !newAdmin) === true ||
        (targetQuestion.questionFormat === "Multiple Choice" &&
          (newOptionA === "" ||
            newOptionA === undefined ||
            newOptionB === "" ||
            newOptionB === undefined ||
            newOptionC === "" ||
            newOptionC === undefined ||
            newOptionD === "" ||
            newOptionD === undefined)) ||
        (targetQuestion.questionFormat === "Multiple Choice" &&
          (!newExpectedAnswer || newExpectedAnswer === ""))
      ) {
        throw new UserInputError("Invalid input");
      } else {
        if (newImage !== undefined) {
          targetQuestion.image = newImage;
        }
        if (
          newQuestionDescription !== undefined &&
          newQuestionDescription !== ""
        ) {
          targetQuestion.questionDescription = newQuestionDescription;
        }
        if (newExpectedAnswer !== undefined) {
          targetQuestion.expectedAnswer = newExpectedAnswer;
        }
        if (newHint !== undefined) {
          targetQuestion.hint = newHint;
        }
        if (newPoints !== undefined) {
          targetQuestion.points = newPoints;
        }
        if (newVideoLink !== undefined) {
          targetQuestion.videoLink = newVideoLink;
        }
        if (newArticleLink !== undefined) {
          targetQuestion.articleLink = newArticleLink;
        }
        if (newType !== undefined && newType !== "") {
          targetQuestion.type = newType;
        }
        if (newSkillDescription !== undefined) {
          targetQuestion.skillDescription = newSkillDescription;
        }
        if (newQuestionName !== undefined && newQuestionName !== "") {
          targetQuestion.questionName = newQuestionName;
        }
        if (newAdminId !== undefined && newAdminId !== "") {
          targetQuestion.adminId = newAdminId;
        }
        if (newOptionA !== undefined) {
          targetQuestion.optionA = newOptionA;
        }
        if (newOptionB !== undefined) {
          targetQuestion.optionB = newOptionB;
        }
        if (newOptionC !== undefined) {
          targetQuestion.optionC = newOptionC;
        }
        if (newOptionD !== undefined) {
          targetQuestion.optionD = newOptionD;
        }
        if (newExtraLink !== undefined) {
          targetQuestion.extraLink = newExtraLink;
        }

        if (newModuleId !== undefined && newModuleId != moduleId && newModule) {
          const index = currentModule.questions.indexOf(questionId);
          currentModule.questions.splice(index, 1);
          await currentModule.save();
          await newModule.questions.push(questionId);
          await newModule.save();
          targetQuestion.moduleId = newModuleId;
        } else if (
          newModuleId != moduleId &&
          newModuleId !== undefined &&
          newModuleId !== ""
        ) {
          throw new UserInputError("Invalid input");
        }
        await targetQuestion.save();
        return targetQuestion;
      }
    },

    async editQuestionTemplate(
      _,
      {
        questionTemplateId,
        newName,
        newCategoryId,
        newInputFields,
        newAdminId,
      },
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
      var newNameQuestionTemplate = await QuestionTemplate.findOne({
        name: newName,
      });
      var newCategory = await Category.findById(newCategoryId);
      var newAdmin = await Admin.findById(newAdminId);
      if (
        !targetQuestionTemplate ||
        (newName !== undefined &&
          newName !== "" &&
          newName !== targetQuestionTemplate.name &&
          newNameQuestionTemplate) ||
        (newCategoryId !== undefined &&
          newCategoryId !== "" &&
          newCategoryId !== targetQuestionTemplate.categoryId &&
          !newCategory) ||
        (newAdminId !== undefined &&
          newAdminId !== "" &&
          newAdminId !== targetQuestionTemplate.adminId &&
          !newAdmin)
      ) {
        throw new UserInputError("Invalid input");
      } else {
        if (newName !== undefined && newName !== "") {
          targetQuestionTemplate.name = newName;
        }
        if (newInputFields !== undefined) {
          targetQuestionTemplate.inputFields = newInputFields;
        }
        if (newCategoryId !== undefined && newCategoryId !== "") {
          targetQuestionTemplate.categoryId = newCategoryId;
        }
        if (newAdminId !== undefined && newAdminId !== "") {
          targetQuestionTemplate.adminId = newAdminId;
        }
        await targetQuestionTemplate.save();
        return targetQuestionTemplate;
      }
    },

    async editChallenge(
      _,
      {
        challengeId,
        newName,
        newCategoryId,
        newChallengeDescription,
        newImage,
        newAdminId,
      },
      context
    ) {
      try {
        const admin = checkAdminAuth(context);
        var targetAdmin = await Admin.findById(admin.id);
      } catch (error) {
        throw new AuthenticationError();
      }
      var targetChallenge = await Challenge.findById(challengeId);
      var newNameChallenge = await Challenge.findOne({
        name: newName,
      });
      var newCategory = await Category.findById(newCategoryId);
      var newAdmin = await Admin.findById(newAdminId);
      if (
        !targetChallenge ||
        (newName !== undefined &&
          newName !== targetChallenge.name &&
          newNameChallenge) ||
        (newCategoryId !== undefined &&
          newCategoryId !== targetChallenge.categoryId &&
          !newCategory) ||
        (newAdminId !== undefined &&
          newAdminId !== targetChallenge.adminId &&
          !newAdmin)
      ) {
        throw new UserInputError("Invalid input");
      } else {
        if (newCategoryId !== undefined) {
          targetChallenge.categoryId = newCategoryId;
        }
        if (newName !== undefined) {
          targetChallenge.name = newName;
        }
        if (newCategoryId !== undefined) {
          targetChallenge.categoryId = newCategoryId;
        }
        if (newChallengeDescription !== undefined) {
          targetChallenge.challengeDescription = newChallengeDescription;
        }
        if (newImage !== undefined) {
          targetChallenge.image = newImage;
        }
        if (newAdminId !== undefined) {
          targetChallenge.adminId = newAdminId;
        }

        await targetChallenge.save();
        return targetChallenge;
      }
    },
    async editCategory(_, { categoryId, newName, newAdminId }, context) {
      try {
        const admin = checkAdminAuth(context);
        var targetAdmin = await Admin.findById(admin.id);
      } catch (error) {
        throw new AuthenticationError();
      }
      var targetCategory = await Category.findById(categoryId);
      var newNameCategory = await Category.findOne({
        name: newName,
      });
      var newAdmin = await Admin.findById(newAdminId);

      if (
        !targetCategory ||
        (newName !== undefined &&
          newName !== targetCategory.name &&
          newNameCategory) ||
        (newAdminId !== undefined &&
          newAdminId !== targetCategory.adminId &&
          !newAdmin)
      ) {
        throw new UserInputError("Invalid input");
      } else {
        if (newName !== undefined) {
          targetCategory.name = newName;
        }
        if (newAdminId !== undefined) {
          targetCategory.adminId = newAdminId;
        }
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
        // console.log(targetModule.questions);
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
