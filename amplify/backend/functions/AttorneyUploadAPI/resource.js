import { defineFunction } from "@aws-amplify/backend";

export const AttorneyUploadAPI = defineFunction({
  name: "AttorneyUploadAPI",
  entry: "./src/index.js",
  runtime: 20,
  environment: {
    BUCKET_NAME: "medlegaldocuments-west2",
    VITE_UPLOAD_PREFIX: "uploads/",
    REGION: "us-west-2",
    FRONTEND_DOMAIN: "https://hybridaimedlegal.com",
  },
});
