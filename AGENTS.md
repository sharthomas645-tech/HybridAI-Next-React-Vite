# HybridAI MedLegal — Developer Agent Guide

## Overview

HybridAI MedLegal is a **Next.js 15** application that allows attorneys to:
1. Upload PHI (Protected Health Information) medical documents
2. Build AI-powered medical chronology timelines
3. Export case chronologies as PDF
4. Request RN (Registered Nurse) verification for cases

Authentication uses **Microsoft Entra ID (Azure AD)** via a PKCE OAuth 2.0 flow. Backend operations are handled by **five separate AWS Lambda APIs** exposed through Amazon API Gateway.

---

## Architecture

```
Attorney Browser
    │
    ▼
Next.js 15 (Azure App Service)
    ├── Page: /              ← Login (Entra ID PKCE redirect)
    ├── Page: /auth/callback ← OAuth 2.0 callback handler
    ├── Page: /dashboard     ← Case management overview
    ├── Page: /upload        ← PHI file upload
    ├── Page: /chronology    ← Build & export chronology
    └── Page: /verification  ← RN verification requests
    │
    ▼ (httpOnly session cookie)
Next.js API Routes (server-side proxies)
    ├── POST /api/auth/token  ← Exchange code with Entra ID + AWS
    ├── POST /api/auth/logout ← Clear session cookie
    ├── POST /api/upload      ← Proxy → AttorneyUploadAPI
    ├── POST /api/build       ← Proxy → BuildChronologyAPI
    ├── POST /api/export      ← Proxy → ExportCaseChronology-API
    └── POST /api/verify      ← Proxy → RNVerificationRequest-API
    │
    ▼
AWS Lambda APIs
    ├── TokenExchangeAPI      https://ld74izi7n6.execute-api.us-west-2.amazonaws.com/prod
    ├── AttorneyUploadAPI     https://vicwyv5xoi.execute-api.us-west-2.amazonaws.com/prod
    ├── BuildChronologyAPI    https://huy6splpn3.execute-api.us-west-2.amazonaws.com/prod
    ├── ExportCaseChronology  https://g4r3dpjiu9.execute-api.us-west-2.amazonaws.com/prod
    └── RNVerificationRequest https://rolkt59qj4.execute-api.us-west-2.amazonaws.com/prod
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/entra-auth.ts` | Entra ID PKCE utilities (replaces Cognito) |
| `src/lib/auth.ts` | Server-side session management (httpOnly cookie) |
| `src/lib/constants.ts` | AWS API endpoint constants |
| `src/lib/types.ts` | TypeScript types for all APIs |
| `src/lib/api-client.ts` | Client-side type-safe API client |
| `src/middleware.ts` | Route protection middleware |
| `src/app/api/auth/token/route.ts` | Token exchange (Entra ID + AWS) |
| `src/app/api/upload/route.ts` | Upload proxy → AttorneyUploadAPI |
| `src/app/api/build/route.ts` | Build proxy → BuildChronologyAPI |
| `src/app/api/export/route.ts` | Export proxy → ExportCaseChronology-API |
| `src/app/api/verify/route.ts` | Verify proxy → RNVerificationRequest-API |

---

## Authentication Flow (PKCE + Entra ID)

```
1. User clicks "Sign in with Microsoft"
   → Client generates PKCE (code_verifier, code_challenge)
   → Stores code_verifier in sessionStorage
   → Redirects to Entra ID /oauth2/v2.0/authorize

2. Entra ID authenticates the user, redirects to /auth/callback?code=...

3. Callback page reads code + code_verifier from sessionStorage
   → POSTs to /api/auth/token { code, codeVerifier, redirectUri }

4. /api/auth/token server route:
   a. Exchanges code with Entra ID /oauth2/v2.0/token
      → Gets { access_token, id_token, expires_in }
   b. Exchanges id_token with AWS TokenExchangeAPI /token-exchange
      → Gets { token: awsToken }
   c. Builds session { accessToken, idToken, email, username, awsToken }
   d. Sets httpOnly session cookie

5. Client is redirected to /dashboard
```

**Security properties:**
- PKCE prevents authorization code interception attacks
- `code_verifier` is in `sessionStorage` (tab-scoped, not persistent)
- Tokens are stored in `httpOnly` cookies (inaccessible to JS)
- AWS token is obtained server-side only
- All API calls go through Next.js server-side proxy

---

## Entra ID Configuration

| Property | Value |
|----------|-------|
| Tenant ID | `c9ca4727-50d1-4e96-b036-671173f94737` |
| Client ID | `f2907ece-23bb-4e42-87d4-a812798454fa` |
| Authority | `https://login.microsoftonline.com/c9ca4727-50d1-4e96-b036-671173f94737` |
| Dev Redirect URI | `http://localhost:3000/auth/callback` |
| Prod Redirect URI | `https://hybridaimedlegal.azurewebsites.net/auth/callback` |
| Scopes | `openid email profile` |

---

## AWS API Endpoints

### TokenExchangeAPI
**Base:** `https://ld74izi7n6.execute-api.us-west-2.amazonaws.com/prod`

| Route | Method | Description |
|-------|--------|-------------|
| `/token-exchange` | POST | Exchange Entra ID id_token for AWS bearer token |
| `/generate_pkce` | POST | Generate PKCE parameters (optional helper) |

**Request:**
```json
{ "id_token": "<Entra ID JWT>" }
```
**Response:**
```json
{ "token": "<aws-bearer-token>", "expires_in": 3600 }
```

### AttorneyUploadAPI
**Base:** `https://vicwyv5xoi.execute-api.us-west-2.amazonaws.com/prod`

| Route | Method | Description |
|-------|--------|-------------|
| `/upload` | PUT | Upload PHI document to S3 |

**Headers:** `Authorization: Bearer <aws-token>`, `Content-Type: <mime>`, `x-case-id`, `x-file-name`

### BuildChronologyAPI
**Base:** `https://huy6splpn3.execute-api.us-west-2.amazonaws.com/prod`

| Route | Method | Description |
|-------|--------|-------------|
| `/build` | POST | Trigger AI chronology generation |

**Request:** `{ "caseId": "C-2024-001", "fileKey": "phi-uploads/..." }`
**Response:** `{ "chronologyId": "...", "status": "queued|processing|complete|error" }`

### ExportCaseChronology-API
**Base:** `https://g4r3dpjiu9.execute-api.us-west-2.amazonaws.com/prod`

| Route | Method | Description |
|-------|--------|-------------|
| `/export` | POST | Export chronology as PDF/document |

**Request:** `{ "caseId": "...", "chronologyId": "...", "format": "pdf" }`
**Response:** `{ "downloadUrl": "...", "fileName": "..." }`

### RNVerificationRequest-API
**Base:** `https://rolkt59qj4.execute-api.us-west-2.amazonaws.com/prod`

| Route | Method | Description |
|-------|--------|-------------|
| `/rn/request` | POST | Submit case for RN verification |

**Request:** `{ "caseId": "...", "patientName": "...", "caseType": "...", "notes": "..." }`
**Response:** `{ "requestId": "...", "status": "submitted|pending|in_review|complete" }`

---

## Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env file
cp .env.example .env.local

# 3. Fill in .env.local (Entra ID values are already set in .env.example)

# 4. Run development server
npm run dev

# 5. Visit http://localhost:3000
```

---

## Environment Variables

See `.env.example` for all variables. Key ones:

```env
# Entra ID (public — safe for client)
NEXT_PUBLIC_ENTRA_TENANT_ID=c9ca4727-50d1-4e96-b036-671173f94737
NEXT_PUBLIC_ENTRA_CLIENT_ID=f2907ece-23bb-4e42-87d4-a812798454fa
NEXT_PUBLIC_ENTRA_AUTHORITY=https://login.microsoftonline.com/c9ca4727-50d1-4e96-b036-671173f94737

# AWS API URLs (public — only base URLs, no secrets)
NEXT_PUBLIC_AWS_TOKEN_EXCHANGE_API=https://ld74izi7n6.execute-api.us-west-2.amazonaws.com/prod
NEXT_PUBLIC_AWS_UPLOAD_API=https://vicwyv5xoi.execute-api.us-west-2.amazonaws.com/prod
NEXT_PUBLIC_AWS_CHRONOLOGY_API=https://huy6splpn3.execute-api.us-west-2.amazonaws.com/prod
NEXT_PUBLIC_AWS_EXPORT_API=https://g4r3dpjiu9.execute-api.us-west-2.amazonaws.com/prod
NEXT_PUBLIC_AWS_VERIFICATION_API=https://rolkt59qj4.execute-api.us-west-2.amazonaws.com/prod

# App URL (server-side — for redirect URI validation)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
```

---

## Adding a New API Endpoint

1. **Add constant** in `src/lib/constants.ts`:
   ```ts
   NEW_API: process.env.NEXT_PUBLIC_AWS_NEW_API ?? "https://...amazonaws.com/prod"
   ```

2. **Add types** in `src/lib/types.ts`:
   ```ts
   export interface NewRequest { ... }
   export interface NewResponse { ... }
   ```

3. **Add API client function** in `src/lib/api-client.ts`:
   ```ts
   export async function callNewApi(req: NewRequest): Promise<NewResponse> {
     return post<NewRequest, NewResponse>("/api/new-endpoint", req);
   }
   ```

4. **Create proxy route** `src/app/api/new-endpoint/route.ts`:
   ```ts
   import { getSession } from "@/lib/auth";
   import { AWS_APIS } from "@/lib/constants";
   // Pattern: validate session, forward to AWS with auth header
   ```

5. **Add environment variable** to `.env.example`

---

## Adding a New Page

New pages follow this pattern:

```tsx
// src/app/new-page/page.tsx (Server Component)
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Header from "@/components/Header";

export default async function NewPage() {
  const session = await getSession();
  if (!session) redirect("/");

  return (
    <>
      <Header user={{ username: session.username, email: session.email }} />
      <main>...</main>
    </>
  );
}
```

**Important:** Add the new route to the middleware matcher in `src/middleware.ts`:
```ts
const PROTECTED_ROUTES = ["/dashboard", "/upload", "/chronology", "/verification", "/new-page"];
```

---

## Component Structure

| Component | Type | Purpose |
|-----------|------|---------|
| `AuroraBackground` | Client | Animated aurora gradient background |
| `Header` | Client | Navigation bar with logout (all authenticated pages) |
| `Dashboard` | Client | Case management grid with metrics |
| `FileUpload` | Client | Drag-and-drop file uploader |
| `ChronologyClient` | Client | Build/export chronology workflow |
| `VerificationClient` | Client | RN verification request form |

---

## Session Structure

Sessions are stored as JSON in an `httpOnly` cookie (`hybridai_session`):

```typescript
interface SessionData {
  accessToken: string;  // Entra ID access token
  idToken: string;      // Entra ID id token (JWT with user claims)
  email: string;        // User's email (from preferred_username claim)
  username: string;     // Display name (from name claim)
  expiresAt: number;    // Unix ms timestamp
  awsToken?: string;    // AWS bearer token from token-exchange Lambda
}
```

---

## Migration Notes (Cognito → Entra ID)

| Before (Cognito) | After (Entra ID) |
|-----------------|-----------------|
| `src/lib/cognito.ts` | `src/lib/entra-auth.ts` |
| `https://{domain}/oauth2/authorize` | `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize` |
| `https://{domain}/oauth2/token` | `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token` |
| `cognito:username` JWT claim | `name` / `preferred_username` JWT claim |
| AWS SDK S3 presigned uploads | AWS Lambda proxy via `PUT /upload` |
| `src/lib/s3.ts` | Removed (uploads go through Lambda) |
| `src/app/api/upload/presign/` | Removed (use `src/app/api/upload/`) |

---

## Deployment to Azure App Service

### Prerequisites
1. Azure subscription
2. Entra ID app registration with redirect URIs configured

### Steps
```bash
# Build the production image
npm run build

# In Azure Portal:
# 1. Create App Service (Linux, Node.js 20 LTS)
# 2. Deployment Center → connect GitHub repo
# 3. Configuration → Application Settings → add all .env.example vars
# 4. Change NEXT_PUBLIC_APP_URL to https://your-app.azurewebsites.net
# 5. Change NEXTAUTH_URL to https://your-app.azurewebsites.net
# 6. Set NODE_ENV=production
# 7. Save → restart
```

### Azure Marketplace Listing
The app uses Entra ID which integrates natively with Azure Marketplace:
- Use "Single tenant" or "Multi-tenant" app registration as needed
- Configure consent scopes in Entra ID app manifest
- Package the app using Azure Marketplace publisher portal

---

## Troubleshooting

**"PKCE state mismatch" error:**
- Ensure you're using the same browser tab for the entire auth flow
- `sessionStorage` is tab-scoped — don't open in new tab

**"Authentication failed" after Entra ID redirect:**
- Check that `NEXT_PUBLIC_APP_URL` matches your actual app URL
- Verify redirect URI is registered in Entra ID app registration

**AWS API calls returning 401:**
- Check if AWS token exchange succeeded (look for `awsToken` in session)
- Token may have expired — re-login to refresh
- Verify Lambda authorizer is configured correctly in API Gateway

**Upload failing:**
- Check file type is in `ALLOWED_EXTENSIONS` (`.pdf`, `.jpg`, `.jpeg`, `.png`, `.tiff`, `.docx`)
- Check file size is under 50MB
- Verify `x-case-id` header is accepted by Lambda CORS config

**Build errors:**
```bash
npm run build  # Check TypeScript errors
npm run lint   # Check ESLint errors
```
