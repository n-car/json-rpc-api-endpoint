
# JSON-RPC API Endpoint

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/json-rpc-api-endpoint.svg)](https://www.npmjs.com/package/json-rpc-api-endpoint)
[![Build Status](https://github.com/n-car/json-rpc-api-endpoint/actions/workflows/main.yml/badge.svg)](https://github.com/n-car/json-rpc-api-endpoint/actions)
[![Coverage Status](https://coveralls.io/repos/github/n-car/json-rpc-api-endpoint/badge.svg?branch=main)](https://coveralls.io/github/n-car/json-rpc-api-endpoint?branch=main)

A lightweight and flexible JSON-RPC 2.0 endpoint for Express.js applications. Easily integrate JSON-RPC methods into your Express server with support for asynchronous handlers and automatic BigInt serialization.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
  - [Basic Setup](#basic-setup)
  - [Adding Methods](#adding-methods)
- [API](#api)
  - [JsonRPCEndpoint Class](#jsonrpcendpoint-class)
    - [Constructor](#constructor)
    - [addMethod](#addmethod)
    - [Properties](#properties)
    - [reply](#reply)
    - [serializeBigInts](#serializebigints)
- [Examples](#examples)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Features

- **JSON-RPC 2.0 Compliance:** Fully adheres to the JSON-RPC 2.0 specification.
- **Asynchronous Support:** Handle asynchronous operations seamlessly with Promises.
- **BigInt Serialization:** Automatically serializes `BigInt` values to strings for JSON compatibility.
- **Flexible Method Registration:** Easily add and manage RPC methods with context support.
- **Error Handling:** Comprehensive error responses following JSON-RPC standards.

## Installation

You can install the package via npm:

```bash
npm install n-car/json-rpc-api-endpoint
```

Or using yarn:

```bash
yarn add n-car/json-rpc-api-endpoint
```

## Usage

### Basic Setup

Integrate `JsonRPCEndpoint` into your Express application by attaching it to an Express router.

```javascript
const express = require('express');
const JsonRPCEndpoint = require('json-rpc-api-endpoint');

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Context object to pass to method handlers
const context = { /* your context data */ };

// Attach to the app router at POST /api endpoint
// If you want to attach to another endpoint you can pass it to the constructor
// es: const rpc = new JsonRPCEndpoint(app, context, '/my-custom-endpoint');
const rpc = new JsonRPCEndpoint(app, context);

// Add RPC methods
rpc.addMethod('add', (req, ctx, params) => {
    const { a, b } = params;
    return a + b;
});

rpc.addMethod('subtract', (req, ctx, params) => {
    const { a, b } = params;
    return a - b;
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

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
```

### Adding Methods

You can add RPC methods using the `addMethod` function. Each method receives the `context` and `params` as arguments.

```javascript
// Synchronous method
rpc.addMethod('multiply', (req, ctx, params) => {
    const { a, b } = params;
    return a * b;
});

// Asynchronous method
rpc.addMethod('divide', async (req, ctx, params) => {
    const { a, b } = params;
    if (b === 0) {
        throw new Error('Division by zero');
    }
    // Simulate async operation
    return Promise.resolve(a / b);
});
```

## API

### JsonRPCEndpoint Class

A class to handle JSON-RPC 2.0 requests in Express.js applications.

#### Constructor

```javascript
new JsonRPCEndpoint(router, context, endpoint = '/api')
```

- **router**: *(Express.Router)* - The Express router to attach the endpoint to.
- **context**: *(Object)* - The context object to pass to the method handlers.
- **endpoint** *(optional)*: *(string)* - The endpoint path (default is `/api`).

#### addMethod

```javascript
addMethod(name, handler)
```

- **name**: *(string)* - The name of the RPC method.
- **handler**: *(Function)* - The function that handles the method. Receives `req` (the Request object) `context` and `params` as arguments.

  ```javascript
  (req, context, params) => { /* ... */ }
  ```

#### Properties

- **endpoint**: *(string)* - Returns the endpoint path.
- **methods**: *(Object)* - Returns the registered methods.

#### reply

```javascript
reply(res, { id, result, error })
```

- **res**: *(Express.Response)* - The Express response object.
- **responsePayload**: *(Object)* - The JSON-RPC response payload.

  ```javascript
  {
      id: string | number | null,
      result: any,
      error: {
          code: number,
          message: string,
          data?: any
      }
  }
  ```

#### serializeBigInts

```javascript
serializeBigInts(value)
```

- **value**: *(any)* - The value to serialize.
- **returns**: *(any)* - The serialized value with `BigInt` converted to strings.

Recursively converts `BigInt` values to strings to ensure JSON serialization compatibility.

## Examples

Check out the [examples](./examples) directory for more usage examples.

### Example: Complete Express Server Integration

```javascript
const express = require('express');
const JsonRPCEndpoint = require('json-rpc-api-endpoint');

const app = express();

app.use(express.json());

const context = { user: 'admin' };

// Attach to the app router at POST /api endpoint
const rpc = new JsonRPCEndpoint(app, context);

rpc.addMethod('greet', (req, ctx, params) => {
    const { name } = params;
    return `Hello, ${name}!`;
});

rpc.addMethod('getTime', () => {
    return new Date().toISOString();
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
```

## License

This project is licensed under the [MIT License](LICENSE).
