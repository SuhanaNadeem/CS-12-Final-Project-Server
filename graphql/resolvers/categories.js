const checkAdminAuth = require("../../util/checkAdminAuth");
const checkMentorAuth = require("../../util/checkMentorAuth");
const checkStudentAuth = require("../../util/checkStudentAuth");

const Admin = require("../../models/Admin");
const Category = require("../../models/Category");

const { UserInputError, AuthenticationError } = require("apollo-server");
const QuestionTemplate = require("../../models/QuestionTemplate");
const Module = require("../../models/Module");
const Challenge = require("../../models/Challenge");

module.exports = {
  Query: {
    async getCategoryById(_, { categoryId }, context) {
      try {
        const admin = checkAdminAuth(context);
      } catch (error) {
        try {
          const mentor = checkMentorAuth(context);
        } catch (error) {
          const student = checkStudentAuth(context);
          if (!student) {
            throw new AuthenticationError();
          }
        }
      }

      const category = await Category.findById(categoryId);
      if (!category) {
        throw new UserInputError("Invalid input");
      } else {
        return category;
      }
    },

    async getCategories(_, {}, context) {
      try {
        const admin = checkAdminAuth(context);
      } catch (error) {
        try {
          const mentor = checkMentorAuth(context);
        } catch (error) {
          const student = checkStudentAuth(context);
          if (!student) {
            throw new AuthenticationError();
          }
        }
      }

      const categories = await Category.find();

      if (!categories) {
        throw new UserInputError("Invalid input");
      } else {
        return categories;
      }
    },

    async getQuestionTemplatesByCategory(_, { categoryId }, context) {
      try {
        const admin = checkAdminAuth(context);
        var targetAdmin = await Admin.findById(admin.id);
      } catch (error) {
        throw new AuthenticationError();
      }
      const targetQuestionTemplates = targetAdmin.questionTemplates;
      if (targetQuestionTemplates) {
        const matches = await QuestionTemplate.find({ categoryId });
        if (!matches) {
          return [];
        } else {
          return matches;
        }
      } else {
        throw new UserInputError("Invalid input");
      }
    },
    async getChallengesByCategory(_, { categoryId }, context) {
      try {
        const admin = checkAdminAuth(context);
        var targetAdmin = await Admin.findById(admin.id);
      } catch (error) {
        throw new AuthenticationError();
      }
      const targetChallenges = await targetAdmin.challenges;
      if (targetChallenges) {
        const matches = await Challenge.find({ categoryId });
        if (!matches) {
          return [];
        } else {
          return matches;
        }
      } else {
        throw new UserInputError("Invalid input");
      }
    },
    async getModulesByCategory(_, { categoryId }, context) {
      try {
        const admin = checkAdminAuth(context);
      } catch (error) {
        try {
          const mentor = checkMentorAuth(context);
        } catch (error) {
          const student = checkStudentAuth(context);
          if (!student) {
            throw new AuthenticationError();
          }
        }
      }

      const modules = await Module.find({ categoryId });
      return modules;
    },
  },
};
