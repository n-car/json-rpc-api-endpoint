const express = require('express');
const JsonRPCEndpoint = require('json-rpc-api-endpoint');

const app = express();
const router = express.Router();

app.use(express.json());

const context = { user: 'admin' };

const rpc = new JsonRPCEndpoint(router, context);

rpc.addMethod('greet', (ctx, params) => {
    const { name } = params;
    return `Hello, ${name}!`;
});

rpc.addMethod('getTime', () => {
    return new Date().toISOString();
});

app.use('/api', router);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
