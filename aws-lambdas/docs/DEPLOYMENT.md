# Deployment Guide

This guide explains how to deploy each Lambda function in the `aws-lambdas/` directory to AWS Lambda.

---

## Prerequisites

- AWS CLI configured with sufficient permissions
- Node.js 18+
- Access to the `medlegaldocuments-west2` S3 bucket and the KMS key ARN

---

## General Deployment Steps

Each Lambda shares the same deployment process:

### 1. Install dependencies

```bash
cd aws-lambdas/<LambdaName>
npm install
```

### 2. Package the Lambda

```bash
zip -r ../deploy/<LambdaName>.zip . --exclude "*.env*" --exclude ".git*"
```

### 3. Deploy to AWS Lambda

**Create (first time):**
```bash
aws lambda create-function \
  --function-name <LambdaName> \
  --runtime nodejs18.x \
  --role arn:aws:iam::150758096276:role/<LambdaName>-Role \
  --handler index.handler \
  --zip-file fileb://../deploy/<LambdaName>.zip \
  --region us-west-2
```

**Update (subsequent deploys):**
```bash
aws lambda update-function-code \
  --function-name <LambdaName> \
  --zip-file fileb://../deploy/<LambdaName>.zip \
  --region us-west-2
```

### 4. Set environment variables

```bash
aws lambda update-function-configuration \
  --function-name <LambdaName> \
  --environment "Variables={REGION=us-west-2,BUCKET_NAME=medlegaldocuments-west2,...}" \
  --region us-west-2
```

See each Lambda's `.env.example` for the full list of variables.

---

## Lambda-Specific Notes

### RNVerificationRequest

- **Runtime:** Node.js 18.x (CommonJS)
- **Handler:** `index.handler`
- **Timeout:** 10 seconds recommended
- **Memory:** 256 MB recommended

```bash
cd aws-lambdas/RNVerificationRequest
npm install
zip -r ../deploy/RNVerificationRequest.zip .
aws lambda update-function-code \
  --function-name RNVerificationRequest \
  --zip-file fileb://../deploy/RNVerificationRequest.zip \
  --region us-west-2
```

### RNVerificationCompleted

- **Runtime:** Node.js 18.x (CommonJS)
- **Handler:** `index.handler`
- **Timeout:** 10 seconds recommended
- **Memory:** 256 MB recommended

```bash
cd aws-lambdas/RNVerificationCompleted
npm install
zip -r ../deploy/RNVerificationCompleted.zip .
aws lambda update-function-code \
  --function-name RNVerificationCompleted \
  --zip-file fileb://../deploy/RNVerificationCompleted.zip \
  --region us-west-2
```

### ExportCaseChronology

- **Runtime:** Node.js 18.x (ES Modules — `"type": "module"` in `package.json`)
- **Handler:** `index.handler`
- **Timeout:** 15 seconds recommended (exports can be larger)
- **Memory:** 512 MB recommended

```bash
cd aws-lambdas/ExportCaseChronology
npm install
zip -r ../deploy/ExportCaseChronology.zip .
aws lambda update-function-code \
  --function-name ExportCaseChronology \
  --zip-file fileb://../deploy/ExportCaseChronology.zip \
  --region us-west-2
```

---

## Environment Variables

Set the environment variables via the AWS Console or AWS CLI after deploying each function.

| Lambda | Variable | Value |
|--------|----------|-------|
| All | `REGION` | `us-west-2` |
| All | `KMS_KEY_ID` | `arn:aws:kms:us-west-2:150758096276:key/3d24a626-a55f-41b3-a2f0-c35fb81e6653` |
| All | `ALLOWED_ORIGIN` | `https://hybridai-next-react-vite-gxf6h5deegewg3bp.westus2-01.azurewebsites.net` |
| All | `REQUEST_TIMEOUT_MS` | `5000` |
| RNVerificationRequest | `BUCKET_NAME` | `medlegaldocuments-west2` |
| RNVerificationCompleted | `RN_VERIFICATIONS_BUCKET` | `medlegaldocuments-west2` |
| RNVerificationCompleted | `RN_VERIFICATIONS_PREFIX` | `rn_verifications` |
| ExportCaseChronology | `BUCKET_NAME` | `medlegaldocuments-west2` |
| ExportCaseChronology | `MAX_EXPORT_SIZE` | `5MB` |
| ExportCaseChronology | `EXPORT_EXPIRATION_SECONDS` | `300` |
