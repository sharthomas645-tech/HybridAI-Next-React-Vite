import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { AttorneyUploadAPI } from './backend/functions/AttorneyUploadAPI/resource';

defineBackend({
  auth,
  data,
  AttorneyUploadAPI,
});
