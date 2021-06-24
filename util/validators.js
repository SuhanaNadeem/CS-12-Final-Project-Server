/* Ensure user's login and signup credentials have a valid email and password, etc. */

const validator = require("validator");

module.exports.validateUserLoginInput = (email, password) => {
  const errors = {};

  if (!validator.isEmail(email)) {
    errors.email = "Invalid email";
  }
  if (validator.isEmpty(email)) {
    errors.email = "Enter email";
  }
  if (validator.isEmpty(password)) {
    errors.password = "Enter password";
  }

  return {
    errors,
    valid: Object.keys(errors).length < 1,
  };
};

module.exports.validateUserRegisterInput = (
  email,
  password,
  confirmPassword
) => {
  const errors = {};

  if (!email) {
    errors.email = "Email must be provided";
  } else if (!validator.isEmail(email)) {
    errors.email = email;
  }
  if (!password) {
    errors.password = "Password must be provided";
  } else if (password != confirmPassword) {
    errors.password = "Passwords don't match";
  }

  return {
    errors,
    valid: Object.keys(errors).length < 1,
  };
};

module.exports.validateUserEditInput = (
  newEmail,
  newPassword,
  newConfirmPassword
) => {
  const errors = {};

  if (newEmail && newEmail !== "" && !validator.isEmail(newEmail)) {
    errors.newEmail = newEmail;
  }

  if (newPassword && newPassword !== "" && newPassword != newConfirmPassword) {
    errors.newPassword = "Passwords don't match";
  }
  return {
    errors,
    valid: Object.keys(errors).length < 1,
  };
};
