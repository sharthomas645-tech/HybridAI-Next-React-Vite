# Attorney App Infrastructure

## Cognito
- User Pool Name: HybridAI_User_Pool
- Client ID: 5dm1etldt5tea0olbf4k8r67jh
- Region: us-west-2

## Lambda Functions
- AttorneyUploadHandler_v3
- RNVerificationRequest
- ExportCaseChronology
- UltimatePlatinumIntelligenceEngine_v3
- RNVerificationCompleted
- BuildCaseChronology
- PlatinumReasoningEngine_v2
- AttorneyCasesHandler

## Important Notes
- DO NOT use AWS Amplify
- All infrastructure managed manually or via CDK/Terraform
- Keep this file updated when adding/removing resources
