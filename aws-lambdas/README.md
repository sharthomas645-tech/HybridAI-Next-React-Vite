# AWS Lambda Functions — HybridAI MedLegal

This directory contains three AWS Lambda functions for the HybridAI MedLegal case management system. All functions handle PHI (Protected Health Information) and are designed to meet HIPAA requirements.

---

## Directory Structure

```
aws-lambdas/
  ├── RNVerificationRequest/       CommonJS Lambda — stores RN verification requests
  │   ├── index.js
  │   ├── package.json
  │   └── .env.example
  ├── RNVerificationCompleted/     CommonJS Lambda — stores completed verification results
  │   ├── index.js
  │   ├── package.json
  │   └── .env.example
  ├── ExportCaseChronology/        ES Modules Lambda — exports chronology data to S3
  │   ├── index.js
  │   ├── package.json
  │   └── .env.example
  ├── tests/                       Ready-to-use test event JSON files
  │   ├── rn-verification-request-test.json
  │   ├── rn-verification-completed-test.json
  │   └── export-case-chronology-test.json
  ├── iam-policies/                IAM policy JSON files for each Lambda
  │   ├── rn-verification-request-policy.json
  │   ├── rn-verification-completed-policy.json
  │   └── export-case-chronology-policy.json
  └── docs/
      ├── DEPLOYMENT.md            How to deploy to AWS Lambda
      ├── TESTING.md               How to test each Lambda
      ├── IAM_SETUP.md             How to set up IAM roles and policies
      └── ARCHITECTURE.md          System architecture and data flow
```

---

## Functions

### RNVerificationRequest

Receives RN verification requests from the React frontend and stores them to S3.

- **Runtime:** Node.js 18.x (CommonJS)
- **Handler:** `index.handler`
- **Input:** `{ firmId, caseId, licensureNumbers, notes? }`
- **Output:** `{ ok, firmId, caseId, s3Key, requestedAt }`

### RNVerificationCompleted

Stores completed RN verification results as immutable S3 records.

- **Runtime:** Node.js 18.x (CommonJS)
- **Handler:** `index.handler`
- **Input:** `{ firmId, caseId, verificationStatus, findings, summary }`
- **Output:** `{ ok, firmId, caseId, verificationStatus, s3Key, completedAt }`

### ExportCaseChronology

Exports AI-generated case chronology data to S3 with KMS encryption.

- **Runtime:** Node.js 18.x (ES Modules)
- **Handler:** `index.handler`
- **Input:** `{ firmId, caseId, fileId, content }`
- **Output:** `{ ok, firmId, caseId, fileId, s3Key, expiresIn, exportedAt }`

---

## Security Features

- ✅ **Input validation** on all required fields
- ✅ **Multi-tenant firm isolation** — `firmId` verified against Entra ID authorizer
- ✅ **CORS restricted** to Azure App Service domain only
- ✅ **KMS encryption** on all S3 objects (`aws:kms`)
- ✅ **Immutable file naming** — timestamp + SHA-256 hash fragment
- ✅ **No PHI logging** — only IDs and metadata written to CloudWatch
- ✅ **HIPAA-safe error handling** — internal errors never exposed in responses
- ✅ **Content size validation** — exports capped at `MAX_EXPORT_SIZE` (default 5MB)
- ✅ **Request timeout** configurable via `REQUEST_TIMEOUT_MS`

---

## AWS Resources

| Resource | Value |
|----------|-------|
| S3 Bucket | `medlegaldocuments-west2` |
| KMS Key | `arn:aws:kms:us-west-2:150758096276:key/3d24a626-a55f-41b3-a2f0-c35fb81e6653` |
| Region | `us-west-2` |
| Allowed Origin | `https://hybridai-next-react-vite-gxf6h5deegewg3bp.westus2-01.azurewebsites.net` |

---

## Documentation

| Doc | Description |
|-----|-------------|
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | How to package and deploy each Lambda |
| [TESTING.md](docs/TESTING.md) | How to test with the AWS Console or CLI |
| [IAM_SETUP.md](docs/IAM_SETUP.md) | How to create IAM roles and attach policies |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture and data flow diagrams |
