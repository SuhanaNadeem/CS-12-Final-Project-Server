const File = require("../../models/File");

const checkAdminAuth = require("../../util/checkAdminAuth");
const { handleCsFileDelete } = require("../../util/handleAWSFiles");

const AmazonS3URI = require("amazon-s3-uri");

module.exports = {
  Query: {
    async getFiles() {
      try {
        const files = await File.find().sort({
          filename: "asc",
        });
        return files;
      } catch (err) {
        throw new Error(err);
      }
    },
  },
  Mutation: {
    async deleteCsFile(_, { fileKey }, context) {
      const admin = checkAdminAuth(context);

      const response = await handleCsFileDelete(fileKey);

      return "File deleted successfully";
    },
  },
};
