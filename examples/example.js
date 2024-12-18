const express = require('express');
const JsonRPCEndpoint = require('json-rpc-api-endpoint');

const app = express();

app.use(express.json());

const context = { user: 'admin' };

const rpc = new JsonRPCEndpoint(app, context);

rpc.addMethod('greet', (ctx, params) => {
    const { name } = params;
    return `Hello, ${name}!`;
});

rpc.addMethod('getTime', () => {
    return new Date().toISOString();
});

rpc.addMethod('invalid-token', (req, ctx, params) => {
    // Example: Validate the token from request headers
    const token = req.headers.authorization;
    if (!token || !isValidToken(token)) { // Replace `isValidToken` with your validation logic
        throw new Error('Invalid or missing token');
    }
    return 'OK';
});

// Example token validation function (replace with your actual logic)
function isValidToken(token) {
    // Simple example: Check if the token matches a predefined value
    const expectedToken = 'my-secret-token'; // Replace with your actual token handling logic
    return token === expectedToken;
}

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
