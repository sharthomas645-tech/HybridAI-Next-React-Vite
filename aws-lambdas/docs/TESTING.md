# Testing Guide

This guide explains how to test each Lambda function using the AWS Console or AWS CLI.

---

## Testing with the AWS Lambda Console

1. Open the [AWS Lambda Console](https://console.aws.amazon.com/lambda)
2. Select the Lambda function to test
3. Click **Test** → **Create new test event**
4. Paste the JSON from the corresponding file in `aws-lambdas/tests/`
5. Click **Test** and inspect the response

---

## Testing with the AWS CLI

```bash
# Invoke and save the response to a local file
aws lambda invoke \
  --function-name <LambdaName> \
  --payload fileb://aws-lambdas/tests/<test-file>.json \
  --cli-binary-format raw-in-base64-out \
  response.json \
  --region us-west-2

cat response.json
```

---

## Test Files

| Lambda | Test File |
|--------|-----------|
| RNVerificationRequest | `tests/rn-verification-request-test.json` |
| RNVerificationCompleted | `tests/rn-verification-completed-test.json` |
| ExportCaseChronology | `tests/export-case-chronology-test.json` |

---

## Expected Responses

### RNVerificationRequest — Success

```json
{
  "statusCode": 200,
  "body": "{\"ok\":true,\"firmId\":\"firm-12345\",\"caseId\":\"case-abc-123\",\"s3Key\":\"firm-12345/rn_verification_requests/case-abc-123/...\",\"requestedAt\":\"...\"}"
}
```

### RNVerificationCompleted — Success

```json
{
  "statusCode": 200,
  "body": "{\"ok\":true,\"firmId\":\"firm-12345\",\"caseId\":\"case-abc-123\",\"verificationStatus\":\"approved\",\"s3Key\":\"rn_verifications/firm-12345/case-abc-123/...\",\"completedAt\":\"...\"}"
}
```

### ExportCaseChronology — Success

```json
{
  "statusCode": 200,
  "body": "{\"ok\":true,\"firmId\":\"firm-12345\",\"caseId\":\"case-abc-123\",\"fileId\":\"export-20260324-001\",\"s3Key\":\"firm-12345/case-abc-123/exports/export-20260324-001-<hash>.json\",\"expiresIn\":300,\"exportedAt\":\"...\"}"
}
```

---

## Testing CORS Preflight

To test the OPTIONS preflight response:

```bash
aws lambda invoke \
  --function-name <LambdaName> \
  --payload '{"httpMethod":"OPTIONS"}' \
  --cli-binary-format raw-in-base64-out \
  response.json \
  --region us-west-2

cat response.json
```

Expected: `{"statusCode": 204, "body": ""}`

---

## Common Error Responses

| Scenario | Status | Error |
|----------|--------|-------|
| Missing firmId in authorizer | 401 | `unauthorized` |
| firmId mismatch | 403 | `forbidden` |
| Invalid input fields | 400 | `validation_error` |
| Malformed JSON body | 400 | `invalid_request_body` |
| S3 write failure | 500 | `storage_error` |
| Unexpected error | 500 | `internal_error` |
