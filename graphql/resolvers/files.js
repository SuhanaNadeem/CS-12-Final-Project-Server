const File = require("../../models/File");

const checkAdminAuth = require("../../util/checkAdminAuth");
const {
  handleCsFileUpload,
  handleCsFileDelete,
} = require("../../util/handleAWSFiles");

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
    async uploadCsFile(_, { file }, context) {
      const admin = checkAdminAuth(context);

      const response = await handleCsFileUpload(file);

      return response;
    },

    async deleteCsFile(_, { fileKey }, context) {
      const admin = checkAdminAuth(context);

      const response = await handleCsFileDelete(fileKey);

      return "File deleted successfully";
    },

    // async uploadRecordedFile(_, {audioUri}, context){
    //   var calculatedCsImgUrl = "";
    //   if (audioUri != null) {
    //     const csImgS3Object = await fileResolvers.Mutation.uploadCsFile(
    //       _,
    //       {
    //         file: audioUri,
    //       },
    //       context
    //     );

    //     if (!csImgS3Object || !csImgS3Object.Location) {
    //       valid = false;
    //       throw new UserInputError("CS S3 Object was not valid", {
    //         errors: {
    //           csImgLogo: "CS upload error, try again",
    //         },
    //       });
    //     }

    //     calculatedCsImgUrl = csImgS3Object.Location;
    //     return("Upload successful")
    //   } return("Upload failed")
    // },
  },
};
