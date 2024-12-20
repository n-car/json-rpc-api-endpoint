export const JsonRPCClient = class {
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
                    ...this.#defaultHeaders, // Default headers
                    ...overrideHeaders, // Override headers
                },
                body: JSON.stringify(this.serializeBigInts(requestBody)),
            });

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
            }

            const responseBody = await response.json();

            if (responseBody.error) {
                throw new Error(`RPC Error: ${responseBody.error.message} (Code: ${responseBody.error.code})`);
            }

            return this.deserializeBigInts(responseBody.result);
        } catch (error) {
            console.error("RPC call failed:", error);
            throw error;
        }
    }

    /**
     * Recursively convert BigInt values to strings for JSON serialization.
     * @param {any} value The value to serialize.
     * @returns {any}
     */
    serializeBigInts(value) {
        if (typeof value === "bigint") {
            return value.toString();
        } else if (Array.isArray(value)) {
            return value.map((v) => this.serializeBigInts(v));
        } else if (value && typeof value === "object") {
            return Object.fromEntries(
                Object.entries(value).map(([key, val]) => [key, this.serializeBigInts(val)])
            );
        }
        return value;
    }

    /**
     * Recursively convert stringified BigInt values back to BigInt.
     * @param {any} value The value to deserialize.
     * @returns {any}
     */
    deserializeBigInts(value) {
        if (typeof value === "string" && /^\d+n?$/.test(value)) {
            return BigInt(value.replace(/n$/, ""));
        } else if (Array.isArray(value)) {
            return value.map((v) => this.deserializeBigInts(v));
        } else if (value && typeof value === "object") {
            return Object.fromEntries(
                Object.entries(value).map(([key, val]) => [key, this.deserializeBigInts(val)])
            );
        }
        return value;
    }
}