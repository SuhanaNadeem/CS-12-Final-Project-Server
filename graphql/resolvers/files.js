const checkUserAuth = require("../../util/checkUserAuth");
const { handleCsFileDelete } = require("../../util/handleAWSFiles");

module.exports = {
  Mutation: {
    // Delete a file stored in AWS bucket with fileKey
    async removeAWSFile(_, { fileKey }, context) {
      checkUserAuth(context);
      await handleCsFileDelete(fileKey);
      return "File deleted successfully";
    },
  },
};
