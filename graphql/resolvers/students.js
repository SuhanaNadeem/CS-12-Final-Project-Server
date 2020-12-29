const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { UserInputError, AuthenticationError } = require("apollo-server");

const {
  validateUserRegisterInput,
  validateUserLoginInput,
} = require("../../util/validators");
const SECRET_KEY = process.env.SECRET_STUDENT_KEY;
const Student = require("../../models/Student");
const Module = require("../../models/Module");
const Badge = require("../../models/Badge");
const Question = require("../../models/Question");

const checkStudentAuth = require("../../util/checkStudentAuth");
function generateToken(student) {
  return jwt.sign(
    {
      id: student.id,
      email: student.email,
    },
    SECRET_KEY
    //{ expiresIn: "3h" }
  );
}

module.exports = {
  Query: {
    async getStudent(_, {}, context) {
      try {
        const student = checkStudentAuth(context);
        const targetStudent = await Student.findById(student.id);
        return targetStudent;
      } catch (error) {
        throw new Error(error);
      }
    },
    async getCompletedModulesByStudent(_, {}, context) {
      try {
        const student = checkStudentAuth(context);
        const targetStudent = await Student.findById(student.id);
        const completedModules = await targetStudent.completedModules;
        return completedModules;
      } catch (error) {
        console.log(error);
        return [];
      }
    },

    async getInProgressModulesByStudent(_, {}, context) {
      try {
        const student = checkStudentAuth(context);
        const targetStudent = await Student.findById(student.id);
        const inProgressModules = await targetStudent.inProgressModules;
        return inProgressModules;
      } catch (error) {
        console.log(error);
        return [];
      }
    },

    async getBadgesByStudent(_, {}, context) {
      try {
        const student = checkStudentAuth(context);
        const targetStudent = await Student.findById(student.id);
        const badges = await targetStudent.badges;
        return badges;
      } catch (error) {
        console.log(error);
        return [];
      }
    },

    async getMentorsByStudent(_, {}, context) {
      try {
        const student = checkStudentAuth(context);
        const targetStudent = await Student.findById(student.id);
        const mentors = await targetStudent.mentors;
        return mentors;
      } catch (error) {
        console.log(error);
        return [];
      }
    },
  },

  Mutation: {
    async signupStudent(_, { email, password, confirmPassword }, context) {
      var { valid, errors } = validateUserRegisterInput(
        email,
        password,
        confirmPassword
      );
      if (!valid) {
        throw new UserInputError("Invalid input")("Errors", { errors });
      }

      const checkStudent = await Student.findOne({ email });
      if (checkStudent) {
        throw new UserInputError("Invalid input")("Email already exists", {
          errors: {
            email: "An student with this email already exists",
          },
        });
      }

      password = await bcrypt.hash(password, 12);

      const newStudent = new Student({
        email,
        password,
        createdAt: new Date(),
      });

      const res = await newStudent.save();

      const token = generateToken(res);

      return { ...res._doc, id: res._id, token };
    },

    async loginStudent(_, { email, password }, context) {
      const { errors, valid } = validateUserLoginInput(email, password);
      if (!valid) {
        throw new UserInputError("Invalid input")("Errors", { errors });
      }

      const student = await Student.findOne({ email });

      if (!student) {
        errors.email = "Student not found";
        throw new UserInputError("Invalid input")("Student not found", {
          errors,
        });
      }

      const match = await bcrypt.compare(password, student.password);

      if (!match) {
        errors.password = "Wrong credentials";
        throw new UserInputError("Invalid input")("Wrong credentials", {
          errors,
        });
      }

      const token = generateToken(student);
      return { ...student._doc, id: student._id, token };
    },

    async deleteStudent(_, { studentId }, context) {
      try {
        var user = checkAdminAuth(context);
      } catch (error) {
        try {
          var user = checkMentorAuth(context);
        } catch (error) {
          throw new Error(error);
        }
      }
      const targetStudent = Student.findById(studentId);
      if (targetStudent !== null) {
        await targetStudent.delete();
        return "Delete Successful";
      } else {
        throw UserInputError("Invalid input");
      }
    },

    async addCompletedModule(_, { moduleId }, context) {
      // add to students module list
      try {
        const student = checkStudentAuth(context);
        var targetStudent = await Student.findById(student.id);
      } catch (error) {
        console.log(error);
        return [];
      }
      const targetModule = Module.findById(moduleId);
      if (targetModule === null) {
        throw UserInputError("Invalid input");
      } else if (!targetStudent.completedModules.includes(moduleId)) {
        targetStudent.completedModules.push(moduleId);
        const updatedCompletedModules = await targetStudent.completedModules;
        return updatedCompletedModules;
      }
    },

    async addInProgressModule(_, { moduleId }, context) {
      // add to students module list
      try {
        const student = checkStudentAuth(context);
        var targetStudent = await Student.findById(student.id);
      } catch (error) {
        console.log(error);
        return [];
      }
      const targetModule = Module.findById(moduleId);

      if (targetModule === null) {
        throw UserInputError("Invalid input");
      } else if (!targetStudent.inProgressModules.includes(targetModule.id)) {
        targetStudent.inProgressModules.push(targetModule.id);
        const updatedInProgressModules = await targetStudent.inProgressModules;
        return updatedInProgressModules;
      }
    },

    async addBadge(_, { badgeId }, context) {
      // add to students module list
      try {
        const student = checkStudentAuth(context);
        var targetStudent = await Student.findById(student.id);
      } catch (error) {
        console.log(error);
        return [];
      }

      const targetBadge = Badge.findById(badgeId);
      if (targetBadge === null) {
        throw UserInputError("Invalid input");
      } else if (!targetStudent.badges.includes(badgeId)) {
        targetStudent.badges.push(badgeId);
        const updatedBadges = await targetStudent.badges;
        return updatedBadges;
      }
    },

    async submitAnswer(
      _,
      { answer, categoryId, questionId, moduleId },
      context
    ) {
      try {
        const student = checkStudentAuth(context);
        var targetStudent = await Student.findById(student.id);
      } catch (error) {
        console.log(error);
        throw UserInputError;
      }
      const quesAnsPair = targetStudent.quesAnsDict.findOne({
        key: questionId,
      });
      const newAnswer = new Answer({
        answer,
        studentId=targetStudent.id,
        categoryId,
        questionId,
        moduleId,
        createdAt: new Date(),
      });
      await newAnswer.save();
      if (quesAnsPair === null) {
        await targetStudent.quesAnsDict.push({
          key: questionId,
          value: newAnswer.id,
        });
      } else {
        await targetStudent.quesAnsDict.push({ value: newAnswer.id });
      }
      return newAnswer;
    },

    async starModule(_, { moduleId }, context) {
      try {
        const student = checkStudentAuth(context);
        var targetStudent = await Student.findById(student.id);
      } catch (error) {
        console.log(error);
        return None;
      }
      const targetModule = Module.findById(moduleId);

      if (targetModule === null) {
        throw UserInputError("Invalid input");
      } else if (!targetStudent.starredModules.includes(moduleId)) {
        targetStudent.starredModules.push(moduleId);
        const updatedStarredModules = await targetStudent.starredModules;
        return updatedStarredModules;
      }
    },

    async unstarModule(_, { moduleId }, context) {
      try {
        const student = checkStudentAuth(context);
        var targetStudent = await Student.findById(student.id);
      } catch (error) {
        console.log(error);
        return None;
      }
      const targetModule = Module.findById(moduleId);

      if (targetModule === null) {
        throw UserInputError("Invalid input");
      } else if (targetStudent.starredModules.includes(moduleId)) {
        const index = targetStudent.starredModules.indexOf(moduleId);
        targetStudent.starredModules.splice(index, 1);
        const updatedStarredModules = await targetStudent.starredModules;
        return updatedStarredModules;
      }
    },

    async starQuestion(_, { questionId }, context) {
      try {
        const student = checkStudentAuth(context);
        var targetStudent = await Student.findById(student.id);
      } catch (error) {
        console.log(error);
        return None;
      }
      const targetQuestion = Question.findOne(questionId);
      if (targetQuestion === null) {
        throw UserInputError("Invalid input");
      } else if (!targetStudent.starredQuestions.includes(questionId)) {
        targetStudent.starredQuestions.push(questionId);
        const updatedStarredQuestions = await targetStudent.starredQuestions;
        return updatedStarredQuestions;
      }
    },
    async unstarQuestion(_, { questionId }, context) {
      try {
        const student = checkStudentAuth(context);
        var targetStudent = await Student.findById(student.id);
      } catch (error) {
        console.log(error);
        return None;
      }
      const targetQuestion = Question.findOne(questionId);
      if (targetQuestion === null) {
        throw UserInputError("Invalid input");
      } else if (targetStudent.starredQuestions.includes(targetQuestion.id)) {
        const index = targetStudent.starredQuestions.indexOf(questionId);
        targetStudent.starredQuestions.splice(index, 1);
        const updatedStarredQuestions = await targetStudent.starredQuestions;
        return updatedStarredQuestions;
      }
    },
    async verifyAnswer(_, { categoryId, questionId, moduleId }, context) {},
  },
};
