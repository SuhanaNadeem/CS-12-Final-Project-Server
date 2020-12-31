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
const checkAdminAuth = require("../../util/checkAdminAuth");
const checkMentorAuth = require("../../util/checkMentorAuth");

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
        throw new UserInputError("Invalid input");
      }
    },
    async getStudents(_, {}, context) {
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
      const students = await Student.find();
      if (!students) {
        throw new UserInputError("Invalid input");
      } else {
        return students;
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
    async signupStudent(
      _,
      { email, orgName, name, password, confirmPassword },
      context
    ) {
      var { valid, errors } = validateUserRegisterInput(
        email,
        password,
        confirmPassword
      );
      if (!valid) {
        throw new UserInputError("Errors", { errors });
      }

      const checkStudent = await Student.findOne({ email });
      if (checkStudent) {
        throw new UserInputError("Email already exists", {
          errors: {
            email: "An student with this email already exists",
          },
        });
      }

      password = await bcrypt.hash(password, 12);

      const newStudent = new Student({
        email,
        name,
        orgName,
        password,
        inProgressModules: [],
        completedModules: [],
        badges: [],
        starredModules: [],
        starredQuestions: [],
        mentors: [],
        quesAnsDict: [],
        modulePointsDict: [],
        createdAt: new Date(),
      });

      const res = await newStudent.save();

      const token = generateToken(res);

      return { ...res._doc, id: res._id, token };
    },

    async loginStudent(_, { email, password }, context) {
      const { errors, valid } = validateUserLoginInput(email, password);
      if (!valid) {
        throw new UserInputError("Errors", { errors });
      }

      const student = await Student.findOne({ email });

      if (!student) {
        errors.email = "Student not found";
        throw new UserInputError("Student not found", {
          errors,
        });
      }

      const match = await bcrypt.compare(password, student.password);

      if (!match) {
        errors.password = "Wrong credentials";
        throw new UserInputError("Wrong credentials", {
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
      const targetStudent = await Student.findById(studentId);
      if (targetStudent) {
        await targetStudent.delete();
        return "Delete Successful";
      } else {
        throw new UserInputError("Invalid input");
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
      if (!targetModule) {
        throw new UserInputError("Invalid input");
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

      if (!targetModule) {
        throw new UserInputError("Invalid input");
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
      if (!targetBadge) {
        throw new UserInputError("Invalid input");
      } else if (!targetStudent.badges.includes(badgeId)) {
        targetStudent.badges.push(badgeId);
        const updatedBadges = await targetStudent.badges;
        return updatedBadges;
      }
    },

    async submitAnswer(
      _,
      { answer, studentId, categoryId, questionId, moduleId },
      context
    ) {
      try {
        const student = checkStudentAuth(context);
        var targetStudent = await Student.findById(student.id);
      } catch (error) {
        console.log(error);
        throw new UserInputError("Invalid input");
      }
      const quesAnsPair = targetStudent.quesAnsDict.findOne({
        key: questionId,
      });
      const newAnswer = new Answer({
        answer,
        studentId,
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
        throw new AuthenticationError();
      }
      const targetModule = Module.findById(moduleId);
      console.log(targetStudent);
      console.log(targetStudent.starredModules);
      if (!targetModule) {
        throw new UserInputError("Invalid input");
      } else if (!targetStudent.starredModules.includes(moduleId)) {
        await targetStudent.starredModules.push(moduleId);
        await targetStudent.save();
        const updatedStarredModules = targetStudent.starredModules;
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

      if (!targetModule) {
        throw new UserInputError("Invalid input");
      } else if (targetStudent.starredModules.includes(moduleId)) {
        const index = targetStudent.starredModules.indexOf(moduleId);
        targetStudent.starredModules.splice(index, 1);
        await targetStudent.save();
        const updatedStarredModules = targetStudent.starredModules;
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
      const targetQuestion = Question.findById(questionId);
      if (!targetQuestion) {
        throw new UserInputError("Invalid input");
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
        throw new UserInputError("Invalid input");
      }
      const targetQuestion = Question.findById(questionId);
      if (!targetQuestion) {
        throw new UserInputError("Invalid input");
      } else if (targetStudent.starredQuestions.includes(targetQuestion.id)) {
        const index = targetStudent.starredQuestions.indexOf(questionId);
        targetStudent.starredQuestions.splice(index, 1);
        const updatedStarredQuestions = await targetStudent.starredQuestions;
        return updatedStarredQuestions;
      }
    },
    async verifyAnswer(_, { answerId, questionId }, context) {
      try {
        const student = checkStudentAuth(context);
        var targetStudent = await Student.findById(student.id);
      } catch (error) {
        console.log(error);
        throw new UserInputError("Invalid input");
      }
      // will be called after submitAnswer()
      const targetQuestion = Question.findById(questionId);
      const targetAnswer = Answer.findById(answerId);
      const expectedAnswers = await targetQuestion.expectedAnswers;
      if (
        targetAnswer === null ||
        targetQuestion === null ||
        expectedAnswers === null ||
        targetAnswer !== expectedAnswers
      ) {
        return false;
      } else {
        return true;
      }
    },
  },
};
