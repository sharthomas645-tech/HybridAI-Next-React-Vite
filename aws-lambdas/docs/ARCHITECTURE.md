# Architecture Overview

This document describes the architecture and data flow for the three AWS Lambda functions in the HybridAI MedLegal system.

---

## System Overview

```
React Frontend (Azure App Service)
    │
    ▼ POST (Authorization: Bearer <aws-token>)
Amazon API Gateway
    ├── POST /rn/request        → RNVerificationRequest Lambda
    ├── POST /rn/completed      → RNVerificationCompleted Lambda
    └── POST /export            → ExportCaseChronology Lambda
    │
    ▼ PutObject (aws:kms)
Amazon S3 — medlegaldocuments-west2
    ├── {firmId}/rn_verification_requests/{caseId}/{timestamp}-{hash}.json
    ├── rn_verifications/{firmId}/{caseId}/{timestamp}-{hash}.json
    └── {firmId}/{caseId}/exports/{fileId}-{hash}.json
    │
    ▼ Encrypt / Decrypt
AWS KMS — arn:aws:kms:us-west-2:150758096276:key/3d24a626-a55f-41b3-a2f0-c35fb81e6653
```

---

## Lambda Functions

### 1. RNVerificationRequest

**Purpose:** Accepts RN verification requests submitted by attorneys and stores them to S3.

**Request Flow:**
1. Attorney submits `{ firmId, caseId, licensureNumbers, notes }` from the frontend
2. API Gateway invokes the Lambda with the Entra ID `firmId` in the authorizer context
3. Lambda validates:
   - `firmId` from body matches `authFirmId` from authorizer (tenant isolation)
   - `caseId` and `firmId` match the ID format (`/^[a-zA-Z0-9\-_]{3,64}$/`)
   - `licensureNumbers` is a non-empty array of valid strings
4. Lambda writes an immutable JSON record to S3 with KMS encryption
5. S3 key: `{firmId}/rn_verification_requests/{caseId}/{ISO-timestamp}-{8-char-hash}.json`

**Module format:** CommonJS

---

### 2. RNVerificationCompleted

**Purpose:** Stores completed RN verification results submitted by RN reviewers.

**Request Flow:**
1. RN reviewer submits `{ firmId, caseId, verificationStatus, findings, summary }`
2. API Gateway invokes the Lambda with `firmId` in the authorizer context
3. Lambda validates:
   - Firm isolation check (body `firmId` == authorizer `firmId`)
   - `verificationStatus` is one of: `approved`, `denied`, `pending_review`, `incomplete`
   - `findings` is a non-null object
   - `summary` is a non-empty string (max 4096 chars)
4. Lambda writes an immutable JSON record to S3 with KMS encryption
5. S3 key: `rn_verifications/{firmId}/{caseId}/{ISO-timestamp}-{8-char-hash}.json`

**Module format:** CommonJS

---

### 3. ExportCaseChronology

**Purpose:** Exports AI-generated case chronology data to S3 for download.

**Request Flow:**
1. Frontend submits `{ firmId, caseId, fileId, content }` where `content` is the chronology object
2. API Gateway invokes the Lambda with `firmId` in the authorizer context
3. Lambda validates:
   - Firm isolation check
   - `firmId`, `caseId`, `fileId` match the ID format
   - `content` is a non-null object under the size limit (`MAX_EXPORT_SIZE`, default 5MB)
4. Lambda writes the content to S3 with KMS encryption
5. S3 key: `{firmId}/{caseId}/exports/{fileId}-{8-char-hash}.json`

**Module format:** ES Modules (`"type": "module"` in `package.json`)

---

## Security Design

| Control | Implementation |
|---------|---------------|
| **CORS** | `ALLOWED_ORIGIN` env var restricts requests to Azure domain only |
| **Authentication** | JWT bearer token validated by API Gateway Entra ID authorizer |
| **Tenant isolation** | `firmId` from authorizer must match `firmId` in request body |
| **Encryption at rest** | All S3 objects use `aws:kms` server-side encryption |
| **Immutable records** | File names include ISO timestamp + SHA-256 hash fragment |
| **No PHI in logs** | CloudWatch logs contain only IDs and metadata, never content |
| **Input validation** | All fields validated before S3 write |
| **Size limits** | Export content capped at `MAX_EXPORT_SIZE` (default 5MB) |

---

## Data Flow Diagram

```
                    ┌─────────────────────────────────┐
                    │   React Frontend (Azure)         │
                    │   https://hybridai-next-*        │
                    └────────────┬────────────────────┘
                                 │ POST + Bearer Token
                                 ▼
                    ┌─────────────────────────────────┐
                    │   Amazon API Gateway             │
                    │   Entra ID Authorizer            │
                    │   → injects firmId into context  │
                    └────────────┬────────────────────┘
                                 │
              ┌──────────────────┼──────────────────────┐
              ▼                  ▼                       ▼
  ┌─────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
  │RNVerification   │ │RNVerification        │ │ExportCase            │
  │Request Lambda   │ │Completed Lambda      │ │Chronology Lambda     │
  │(CommonJS)       │ │(CommonJS)            │ │(ES Modules)          │
  └────────┬────────┘ └──────────┬───────────┘ └──────────┬───────────┘
           │                     │                         │
           └─────────────────────┴─────────────────────────┘
                                 │ PutObject (aws:kms)
                                 ▼
                    ┌─────────────────────────────────┐
                    │   Amazon S3                      │
                    │   medlegaldocuments-west2        │
                    │   (KMS-encrypted)                │
                    └─────────────────────────────────┘
```

---

## S3 Key Structure

```
medlegaldocuments-west2/
  ├── {firmId}/
  │   ├── rn_verification_requests/
  │   │   └── {caseId}/
  │   │       └── 2026-03-24T03-50-00-000Z-ab12cd34.json
  │   └── {caseId}/
  │       └── exports/
  │           └── export-20260324-001-ab12cd34.json
  └── rn_verifications/
      └── {firmId}/
          └── {caseId}/
              └── 2026-03-24T03-50-00-000Z-ab12cd34.json
```
