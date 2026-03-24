# IAM Setup Guide

This guide explains how to create IAM execution roles for each Lambda function and attach the appropriate policies.

---

## Overview

Each Lambda function requires a dedicated IAM execution role with:
1. The AWS managed `AWSLambdaBasicExecutionRole` policy (for CloudWatch Logs)
2. A custom inline policy granting S3 `PutObject` and KMS permissions (scoped to the specific bucket and key)

The custom policy JSON files are located in `aws-lambdas/iam-policies/`.

---

## Step-by-Step: Create an Execution Role

### 1. Create the trust policy document

Save the following as `/tmp/lambda-trust-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

### 2. Create the IAM role

```bash
aws iam create-role \
  --role-name <LambdaName>-Role \
  --assume-role-policy-document file:///tmp/lambda-trust-policy.json \
  --region us-west-2
```

### 3. Attach the AWS managed basic execution policy

```bash
aws iam attach-role-policy \
  --role-name <LambdaName>-Role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
```

### 4. Attach the custom inline policy

```bash
aws iam put-role-policy \
  --role-name <LambdaName>-Role \
  --policy-name <LambdaName>-Policy \
  --policy-document file://aws-lambdas/iam-policies/<lambda-policy>.json
```

---

## Lambda-Specific Roles

### RNVerificationRequest

```bash
# Create role
aws iam create-role \
  --role-name RNVerificationRequest-Role \
  --assume-role-policy-document file:///tmp/lambda-trust-policy.json

# Attach basic execution
aws iam attach-role-policy \
  --role-name RNVerificationRequest-Role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Attach custom policy
aws iam put-role-policy \
  --role-name RNVerificationRequest-Role \
  --policy-name RNVerificationRequest-Policy \
  --policy-document file://aws-lambdas/iam-policies/rn-verification-request-policy.json
```

### RNVerificationCompleted

```bash
aws iam create-role \
  --role-name RNVerificationCompleted-Role \
  --assume-role-policy-document file:///tmp/lambda-trust-policy.json

aws iam attach-role-policy \
  --role-name RNVerificationCompleted-Role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws iam put-role-policy \
  --role-name RNVerificationCompleted-Role \
  --policy-name RNVerificationCompleted-Policy \
  --policy-document file://aws-lambdas/iam-policies/rn-verification-completed-policy.json
```

### ExportCaseChronology

```bash
aws iam create-role \
  --role-name ExportCaseChronology-Role \
  --assume-role-policy-document file:///tmp/lambda-trust-policy.json

aws iam attach-role-policy \
  --role-name ExportCaseChronology-Role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws iam put-role-policy \
  --role-name ExportCaseChronology-Role \
  --policy-name ExportCaseChronology-Policy \
  --policy-document file://aws-lambdas/iam-policies/export-case-chronology-policy.json
```

---

## KMS Key Policy

Ensure the Lambda execution roles are added to the KMS key policy as key users. In the [KMS Console](https://console.aws.amazon.com/kms), select the key and add each Lambda role ARN under **Key users**.

---

## Principle of Least Privilege

Each policy grants the minimum permissions needed:

| Lambda | S3 Permissions | S3 Scope |
|--------|---------------|----------|
| RNVerificationRequest | `s3:PutObject` | `*/rn_verification_requests/*` |
| RNVerificationCompleted | `s3:PutObject` | `rn_verifications/*` |
| ExportCaseChronology | `s3:PutObject` | `*/exports/*` |

No `s3:GetObject`, `s3:DeleteObject`, or `s3:*` wildcards are granted.
