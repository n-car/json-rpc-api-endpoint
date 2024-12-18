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
- **TypeScript Support:** Includes JSDoc types for better editor integration and TypeScript compatibility.
- **Error Handling:** Comprehensive error responses following JSON-RPC standards.

## Installation

You can install the package via npm:

```bash
npm install json-rpc-api-endpoint

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

