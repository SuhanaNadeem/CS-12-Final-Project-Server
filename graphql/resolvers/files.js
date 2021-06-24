const checkUserAuth = require("../../util/checkUserAuth");
const { handleCsFileDelete } = require("../../util/handleAWSFiles");

module.exports = {
  Mutation: {
    async removeAWSFile(_, { fileKey }, context) {
      checkUserAuth(context);
      await handleCsFileDelete(fileKey);
      return "File deleted successfully";
    },
  },
};
