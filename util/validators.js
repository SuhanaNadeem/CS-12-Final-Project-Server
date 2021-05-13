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

  // // neither pass or email was given
  // if ((!newEmail || newEmail === "") && (!newPassword || newPassword === "")) {
  //   errors.newEmail = "New email or password must be provided";
  // }
  // email given but DNE
  if (newEmail && newEmail !== "" && !validator.isEmail(newEmail)) {
    errors.newEmail = newEmail;
  }
  // pass given but do not match
  if (newPassword && newPassword !== "" && newPassword != newConfirmPassword) {
    errors.newPassword = "Passwords don't match";
  }
  return {
    errors,
    valid: Object.keys(errors).length < 1,
  };
};
