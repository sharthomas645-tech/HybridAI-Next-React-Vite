const { DynamoDBClient, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamoClient = new DynamoDBClient({
    region: process.env.REGION || 'us-west-2'
});

const TABLE_NAME = process.env.TABLE_NAME || 'Cases';
const CORS_ORIGIN = 'https://hybridaimedlegal.com';

const corsHeaders = {
    'Access-Control-Allow-Origin': CORS_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Expose-Headers': 'Content-Type,Authorization,X-Amz-Date',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json'
};

/**
 * Handle OPTIONS CORS preflight requests
 */
const handleOptions = () => {
    return {
        statusCode: 200,
        headers: corsHeaders,
        body: ''
    };
};

/**
 * Handle GET /cases request
 */
const handleGetCases = async (event) => {
    try {
        console.log('=== GET CASES START ===');
        
        // Extract JWT claims from authorizer - check both possible paths
        let claims = event.requestContext?.authorizer?.jwt?.claims;
        if (!claims) {
            claims = event.requestContext?.authorizer?.claims;
        }
        console.log('Claims:', JSON.stringify(claims));
        
        if (!claims) {
            console.error('No claims found in authorizer');
            return {
                statusCode: 401,
                headers: corsHeaders,
                body: JSON.stringify({ 
                    success: false, 
                    error: 'Unauthorized: Missing JWT claims' 
                })
            };
        }
        
        const userId = claims.sub || claims.username || claims['custom:attorneyId'];
        const email = claims.email;
        const firmId = claims['custom:firmId'];
        const attorneyId = claims['custom:attorneyId'];
        
        console.log('Extracted:', { userId, email, firmId, attorneyId });
        
        if (!userId) {
            console.error('Missing user identifier in claims');
            return {
                statusCode: 401,
                headers: corsHeaders,
                body: JSON.stringify({ 
                    success: false, 
                    error: 'Unauthorized: Missing user identifier' 
                })
            };
        }
        
        // Query cases by userId (Partition Key or GSI)
        console.log(`Querying ${TABLE_NAME} for userId: ${userId}`);
        
        const command = new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': { S: userId }
            }
        });
        
        console.log('DynamoDB Query Command:', JSON.stringify(command.input, null, 2));
        console.log('Executing DynamoDB Query...');
        
        const result = await dynamoClient.send(command);
        
        console.log('Query succeeded. Items returned:', result.Items?.length || 0);
        
        // Unmarshall DynamoDB items
        const cases = (result.Items || []).map(item => unmarshall(item));
        
        console.log('Cases:', JSON.stringify(cases));
        
        // Format response
        const response = {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                success: true,
                userId: userId,
                email: email,
                firmId: firmId,
                attorneyId: attorneyId,
                cases: cases,
                count: cases.length,
                timestamp: new Date().toISOString()
            })
        };
        
        console.log('=== GET CASES COMPLETE ===');
        return response;
        
    } catch (err) {
        console.error('=== GET CASES ERROR ===');
        console.error('Error Type:', err.name);
        console.error('Error Message:', err.message);
        console.error('Error Stack:', err.stack);
        
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                success: false,
                error: 'Internal server error',
                message: err.message,
                timestamp: new Date().toISOString()
            })
        };
    }
};

/**
 * Main Lambda handler
 */
exports.handler = async (event) => {
    console.log('=== REQUEST RECEIVED ===');
    console.log('Event:', JSON.stringify(event, null, 2));
    console.log('Method:', event.requestContext?.http?.method);
    console.log('Path:', event.requestContext?.http?.path);
    console.log('RawPath:', event.rawPath);
    
    try {
        const method = event.requestContext?.http?.method;
        const path = event.requestContext?.http?.path;
        const rawPath = event.rawPath;
        
        // Handle OPTIONS preflight
        if (method === 'OPTIONS') {
            console.log('Handling OPTIONS preflight');
            return handleOptions();
        }
        
        // Handle GET /cases - match both /cases and /prod/cases (with stage prefix)
        if (method === 'GET' && (path === '/cases' || rawPath === '/prod/cases' || path.endsWith('/cases'))) {
            console.log('Handling GET /cases');
            return await handleGetCases(event);
        }
        
        // Handle unsupported routes
        console.warn(`Unsupported route: ${method} ${path}`);
        return {
            statusCode: 405,
            headers: corsHeaders,
            body: JSON.stringify({
                success: false,
                error: 'Method not allowed',
                method: method,
                path: path
            })
        };
        
    } catch (err) {
        console.error('=== HANDLER ERROR ===');
        console.error('Error:', err);
        
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                success: false,
                error: 'Internal server error',
                message: err.message
            })
        };
    }
};
