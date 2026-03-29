/**
 * AWS Token Exchange Service
 *
 * Handles the PKCE-based token exchange flow:
 *   1. Call Generate_PKCE Lambda to get a server-side PKCE code_challenge
 *   2. Call CognitoTokenExchange Lambda to exchange an Entra ID id_token
 *      for temporary AWS credentials.
 */

import { AWS_APIS } from "./constants";

export interface AwsTokenExchangeResponse {
  /** JWT bearer token for AWS API Gateway (CognitoLambdaAuthorizer) */
  token?: string;
  access_token?: string;
  expires_in?: number;
  message?: string;
}

export interface GeneratePkceResponse {
  code_challenge?: string;
  code_verifier?: string;
  state?: string;
}

/**
 * Call the Generate_PKCE Lambda to obtain a server-side PKCE challenge.
 * Returns the parsed response or null on failure.
 */
export async function generateServerPKCE(): Promise<GeneratePkceResponse | null> {
  try {
    const res = await fetch(`${AWS_APIS.TOKEN_EXCHANGE}/generate_pkce`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!res.ok) return null;
    return (await res.json()) as GeneratePkceResponse;
  } catch {
    return null;
  }
}

/**
 * Exchange an Entra ID id_token for temporary AWS credentials via the
 * CognitoTokenExchange Lambda.
 *
 * Returns the AWS bearer token string, or undefined if the exchange fails.
 * Failure is intentionally non-fatal — the app can still operate with the
 * Entra ID id_token as a fallback where the Lambda authorizer accepts it.
 */
export async function exchangeEntraIdTokenForAWSCredentials(
  idToken: string
): Promise<string | undefined> {
  try {
    const res = await fetch(`${AWS_APIS.TOKEN_EXCHANGE}/token-exchange`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      // The Lambda accepts id_token in both the Authorization header and the request body.
      body: JSON.stringify({ id_token: idToken }),
    });
    if (!res.ok) return undefined;
    const data = (await res.json()) as AwsTokenExchangeResponse;
    return data.token ?? data.access_token;
  } catch {
    return undefined;
  }
}
