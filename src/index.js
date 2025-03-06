"use strict";

const path = require("path");
const express = require("express");

/** @typedef {import("express").Router} Router */
/** @typedef {import("express").Request} Request */
/** @typedef {import("express").Response} Response */

const NestedError = require('nested-error-stacks');

/**
 * Default properties to include in error serialization.
 * @type {Array<string>}
 */
const defaultProperties = [
  'stackTraceLimit', 'cause', 'code', 'message', 'stack', 'address',
  'dest', 'errno', 'info', 'path', 'port', 'syscall', 'opensslErrorStack',
  'function', 'library', 'reason'
];

/**
 * Serializes an error into a JSON-compatible format, with optional sanitization.
 * @param {Error | NestedError | Object} error - The error to serialize.
 * @param {boolean} sanitize - Whether to remove sensitive fields.
 * @param {Array<string>} properties - Properties to include in serialization.
 * @returns {Object} The serialized error.
 */
const serializeError = (error, sanitize = false, properties = defaultProperties) => {
  if (error === null || error === undefined) return error;

  const result = {};
  const includeProperties = sanitize
      ? properties.filter(prop => !['address', 'path'].includes(prop))
      : properties;

  includeProperties.forEach(prop => {
      if (error?.[prop] !== undefined) {
          result[prop] = error[prop];
      }
  });

  if (error instanceof NestedError) {
      result.type = 'NestedError';
      if (error.nested) result.nested = serializeError(error.nested, sanitize, properties);
  } else if (error instanceof Error) {
      result.type = 'Error';
  } else if (error instanceof Object) {
      result.type = 'Object';
      Object.assign(result, error);
  } else {
      result.type = 'Default';
      result.instance = error;
  }

  return result;
};

/**
 * @template C
 */
class JsonRPCEndpoint {
  /**
   * Serve client scripts for making JSON-RPC calls from the browser.
   * @param {Router} router Express.Router instance
   * @param {string} [url="/vendor/json-rpc-api-client"]
   *    The path from which client scripts will be served.
   */
  static serveScripts(router, url = "/vendor/json-rpc-api-client") {
    router.use(url, express.static(path.join(__dirname, "client-scripts")));
  }

  /** @type {string} */
  #endpoint;

  /** @type {{ [name: string]: (req: Request, context: C, params: any) => any|Promise<any> }} */
  #methods = {};

  /**
   * @param {Router} router The Express router to attach the endpoint to.
   * @param {C} context The context object to pass to the method handlers.
   * @param {string} [endpoint="/api"] The endpoint path for JSON-RPC calls.
   */
  constructor(router, context, endpoint = "/api") {
    this.#endpoint = endpoint;

    // Wire up a POST route for JSON-RPC 2.0 requests
    router.post(this.#endpoint, (req, res) => {
      const { jsonrpc, method, params, id } = req.body || {};

      // Validate JSON-RPC 2.0 request
      if (jsonrpc !== "2.0") {
        return this.reply(res, {
          id,
          error: { code: -32600, message: `Invalid Request: 'jsonrpc' must be '2.0'.` }
        });
      }

      if (typeof method !== "string") {
        return this.reply(res, {
          id,
          error: { code: -32600, message: `Invalid Request: 'method' must be a string.` }
        });
      }

      const handler = this.#methods[method];
      if (!handler) {
        return this.reply(res, {
          id,
          error: { code: -32601, message: `Method "${method}" not found` }
        });
      }

      // Invoke the handler, then serialize the result properly
      try {
        Promise.resolve(handler(req, context, params))
          .then((result) => {
            // Convert any BigInt/Date values before JSON-stringifying
            const safeResult = this.serializeBigIntsAndDates(result);
            this.reply(res, { id, result: safeResult });
          })
          .catch((err) => {
            this.reply(res, {
              id,
              error: { code: err.code || -32603, message: err.message || `Internal error`, error: serializeError(err, true) }
            });
          });
      } catch (err) {
        this.reply(res, {
          id,
          error: { code: -32603, message: err.message || `Internal error`, error: serializeError(err, true) }
        });
      }
    });
  }

  /**
   * Register a new JSON-RPC method (e.g., "getUserData").
   * @param {string} name The method name.
   * @param {(req: Request, context: C, params: any) => any|Promise<any>} handler The function to handle calls.
   */
  addMethod(name, handler) {
    this.#methods[name] = handler;
  }

  /** @returns {string} The endpoint path (e.g. "/api"). */
  get endpoint() {
    return this.#endpoint;
  }

  /**
   * @returns {{ [name: string]: (req: Request, context: C, params: any) => any|Promise<any> }}
   * All registered methods.
   */
  get methods() {
    return this.#methods;
  }

  /**
   * Send a JSON-RPC 2.0 response.
   * @param {Response} res The Express response object.
   * @param {{
   *   id?: string|number|null,
   *   result?: any,
   *   error?: { code: number, message: string, data?: any }
   * }} responsePayload The JSON-RPC response fields.
   */
  reply(res, { id, result, error }) {
    const response = { jsonrpc: "2.0", id: id === undefined ? null : id };

    if (error) {
      response.error = error;
    } else {
      response.result = result;
    }

    res.json(response);
  }

  /**
   * Recursively convert BigInt values to strings and Date objects to ISO strings.
   * This is crucial because JSON.stringify() cannot handle BigInt natively
   * and Date objects are best transmitted in a standardized format.
   *
   * @param {any} value The value to serialize.
   * @returns {any} A version of `value` safe for JSON serialization.
   */
  serializeBigIntsAndDates(value) {
    if (typeof value === "bigint") {
      // Convert BigInt to string
      return value.toString();
    } else if (Array.isArray(value)) {
      // Recurse into arrays
      return value.map((v) => this.serializeBigIntsAndDates(v));
    } else if (value instanceof Date) {
      // Convert Date to ISO string (UTC)
      return value.toISOString();
    } else if (value && typeof value === "object") {
      // Recurse into plain objects
      const result = {};
      for (const [key, val] of Object.entries(value)) {
        result[key] = this.serializeBigIntsAndDates(val);
      }
      return result;
    }

    // If it's none of the above, return as-is
    return value;
  }

  /**
   * Recursively convert stringified BigInts back to BigInt,
   * and ISO 8601 date strings back to Date objects.
   *
   * This is useful if you receive JSON that was serialized
   * by `serializeBigIntsAndDates()` and want to re-hydrate
   * the original types.
   *
   * @param {any} value The value to deserialize.
   * @returns {any} The re-hydrated value.
   */
  deserializeBigIntsAndDates(value) {
    // A stricter ISO date regex (UTC “Z” only):
    const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

    // 1. Check if it's a string that might be a BigInt or a Date
    if (typeof value === "string") {
      // BigInt check: matches digits, optionally ending in "n"
      // e.g., "42n" or "42"
      if (/^\d+n?$/.test(value)) {
        return BigInt(value.replace(/n$/, ""));
      }

      // Date check: matches an ISO 8601 string with UTC "Z"
      if (ISO_DATE_REGEX.test(value)) {
        const date = new Date(value);
        // Double-check that we got a valid date
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }

    // 2. If it's an array, handle each element
    if (Array.isArray(value)) {
      return value.map((v) => this.deserializeBigIntsAndDates(v));
    }

    // 3. If it's a plain object, recurse into each property
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value).map(([key, val]) => [
          key,
          this.deserializeBigIntsAndDates(val)
        ])
      );
    }

    // 4. For everything else (number, boolean, null, undefined, etc.), return as-is
    return value;
  }
}

module.exports = JsonRPCEndpoint;
