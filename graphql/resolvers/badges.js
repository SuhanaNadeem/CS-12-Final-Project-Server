const checkMentorAuth = require("../../util/checkMentorAuth");
const checkStudentAuth = require("../../util/checkStudentAuth");
const checkAdminAuth = require("../../util/checkAdminAuth");

const Admin = require("../../models/Admin");
const Student = require("../../models/Student");
const Mentor = require("../../models/Mentor");

const { UserInputError, AuthenticationError } = require("apollo-server");
const Badge = require("../../models/Badge");

module.exports = {
  Query: {
    async getBadges(_, {}, context) {
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

      const badges = await Badge.find();

      return badges;
    },
    async getBadgesByStudent(_, {}, context) {
      try {
        const student = checkStudentAuth(context);
        var targetStudent = await Student.findById(student.id);
      } catch (error) {
        throw new AuthenticationError();
      }
      const badges = targetStudent.badges;

      return badges;
    },
  },

  Mutation: {
    async createNewBadge(_, { image, name, description, criteria }, context) {
      try {
        const admin = checkAdminAuth(context);
        var targetAdmin = await Admin.findById(admin.id);
      } catch (error) {
        throw new AuthenticationError();
      }

      const targetBadge = await Badge.findOne({ name });

      if (!targetBadge) {
        const newBadge = new Badge({
          name,
          image,
          criteria,
          description,
          createdAt: new Date(),
        });

        await newBadge.save();

        targetAdmin.badges.push(newBadge.id);
        await targetAdmin.save();

        return newBadge;
      } else {
        return targetBadge;
      }
    },

    async editBadge(
      _,
      { badgeId, newImage, newName, newCriteria, newDescription },
      context
    ) {
      try {
        const admin = checkAdminAuth(context);
        var targetAdmin = await Admin.findById(admin.id);
      } catch (error) {
        throw new AuthenticationError();
      }
      var targetBadge = await Badge.findById(badgeId);
      if (!targetBadge) {
        throw new UserInputError("Invalid input");
      } else {
        targetBadge.name = newName;
        targetBadge.criteria = newCriteria;
        targetBadge.description = newDescription;
        targetBadge.image = newImage;

        await targetBadge.save();
        return targetBadge;
      }
    },
    async addBadge(_, { badgeId }, context) {
      try {
        const student = checkStudentAuth(context);
        var targetStudent = await Student.findById(student.id);
      } catch (error) {
        throw new Error(error);
      }

      const targetBadge = await Badge.findById(badgeId);
      if (!targetBadge) {
        throw new UserInputError("Invalid input");
      } else if (!targetStudent.badges.includes(badgeId)) {
        await targetStudent.badges.push(badgeId);
        await targetStudent.save();
      }
      const updatedBadges = targetStudent.badges;
      return updatedBadges;
    },

    async deleteBadge(_, { badgeId }, context) {
      try {
        const admin = checkAdminAuth(context);
        var targetAdmin = await Admin.findById(admin.id);
      } catch (error) {
        throw new AuthenticationError();
      }
      const targetBadge = await Badge.findById(badgeId);
      if (!targetBadge) {
        throw new UserInputError("Invalid input");
      } else {
        await targetBadge.delete();
        const updatedBadges = await Badge.find();
        return updatedBadges;
      }
    },
  },
};
