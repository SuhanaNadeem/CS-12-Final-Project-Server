const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { AdminInputError } = require("apollo-server");

const {
  validateUserRegisterInput,
  validateUserLoginInput,
} = require("../../util/validators");

const SECRET_KEY = process.env.SECRET_ADMIN_KEY;
const Admin = require("../../models/Admin");

const checkAdminAuth = require("../../util/checkAdminAuth");

function generateToken(admin) {
  return jwt.sign(
    {
      id: admin.id,
      email: admin.email,
    },
    SECRET_KEY
    //{ expiresIn: "3h" }
  );
}

module.exports = {
  Query: {
    async getAdmin(_, {}, context) {
      // console.log("coming here in getAdmin");
      try {
        const admin = checkAdminAuth(context);
        const targetAdmin = await Admin.findById(admin.id);
        return targetAdmin;
      } catch (error) {
        throw new AuthenticationError();
      }
    },
    async getAdminById(_, { adminId }, context) {
      console.log("comes in here in getAdminById");
      try {
        const admin = checkAdminAuth(context);
      } catch (error) {
        throw new AuthenticationError();
      }

      const targetAdmin = await Admin.findById(adminId);
      if (!targetAdmin) {
        throw new UserInputError("No such admin", {
          errors: {
            adminId: "There is no admin with this ID",
          },
        });
      } else {
        return targetAdmin;
      }
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
        throw new AdminInputError("Errors", { errors });
      }

      const checkAdmin = await Admin.findOne({ email });
      if (checkAdmin) {
        throw new AdminInputError("Email already exists", {
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
      console.log("Coming in here: loginAdmin");
      const { errors, valid } = validateUserLoginInput(email, password);
      if (!valid) {
        throw new AdminInputError("Errors", { errors });
      }

      const admin = await Admin.findOne({ email });

      if (!admin) {
        errors.email = "Admin not found";
        throw new AdminInputError("Admin not found", {
          errors,
        });
      }

      const match = await bcrypt.compare(password, admin.password);

      if (!match) {
        errors.password = "Wrong credentials";
        throw new AdminInputError("Wrong credentials", {
          errors,
        });
      }

      const token = generateToken(admin);
      return { ...admin._doc, id: admin._id, token };
    },

    async deleteAdmin(_, { adminId }, context) {
      try {
        var admin = checkAdminAuth(context);
      } catch (error) {
        try {
          var admin = checkMentorAuth(context);
        } catch (error) {
          throw new Error(error);
        }
      }

      const targetAdmin = await Admin.findById(adminId);
      if (targetAdmin) {
        await targetAdmin.delete();
        return "Delete Successful";
      } else {
        throw new AdminInputError("Invalid input");
      }
    },
  },
};
