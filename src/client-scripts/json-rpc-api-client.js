class JsonRPCClient {
  #endpoint;
  #defaultHeaders;

  /**
   * @param {string} endpoint The JSON-RPC endpoint URL.
   * @param {Object} [defaultHeaders={}] Optional default headers to include in requests.
   */
  constructor(endpoint, defaultHeaders = {}) {
    this.#endpoint = endpoint;
    this.#defaultHeaders = {
      "Content-Type": "application/json", // Default header
      ...defaultHeaders, // Merge with user-provided defaults
    };
  }

  /**
   * Make a JSON-RPC call to the server.
   * @param {string} method The RPC method name.
   * @param {any} params The parameters to pass to the RPC method.
   * @param {string|number|null} [id] The request ID (optional for notifications).
   * @param {Object} [overrideHeaders={}] Optional headers to override defaults for this request.
   * @returns {Promise<any>} The result of the RPC call.
   */
  async call(method, params = {}, id = null, overrideHeaders = {}) {
    const requestBody = {
      jsonrpc: "2.0",
      method,
      params,
      id,
    };

    try {
      const response = await fetch(this.#endpoint, {
        method: "POST",
        headers: {
          ...this.#defaultHeaders,
          ...overrideHeaders,
        },
        body: JSON.stringify(this.serializeBigIntsAndDates(requestBody)),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const responseBody = await response.json();
      console.dir(responseBody); // For debugging

      if (responseBody.error) {
        throw new Error(
          `RPC Error: ${responseBody.error.message} (Code: ${responseBody.error.code})`
        );
      }

      // Convert back BigInts and Dates in the result
      return this.deserializeBigIntsAndDates(responseBody.result);
    } catch (error) {
      console.error("RPC call failed:", error);
      throw error;
    }
  }

  /**
   * Recursively convert BigInt values to strings and Date objects to ISO strings
   * so they can be JSON-serialized.
   * @param {any} value
   * @returns {any}
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

    // If it's neither an array, an object, a Date, nor a bigint, return as-is
    return value;
  }

  /**
   * Recursively convert stringified BigInt values back to BigInt
   * and ISO 8601 date strings back to Date objects.
   *
   * @param {any} value The value to deserialize.
   * @returns {any}
   */
  deserializeBigIntsAndDates(value) {
    // A stricter ISO date regex for UTC (Z) only
    const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

    // 1. Check if it's a string that might be a BigInt or a Date
    if (typeof value === "string") {
      // BigInt check: matches digits, optionally ending in "n"
      // e.g., "42n" or "42"
      if (/^\d+n?$/.test(value)) {
        return BigInt(value.replace(/n$/, ""));
      }
      // Date check: matches an ISO 8601 string ending with "Z"
      if (ISO_DATE_REGEX.test(value)) {
        const date = new Date(value);
        // Ensure it's valid
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
          this.deserializeBigIntsAndDates(val),
        ])
      );
    }

    // 4. Fallback for primitives, etc.
    return value;
  }
}

module.exports = JsonRPCClient;
