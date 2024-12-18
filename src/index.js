"use strict";

/** @typedef {import('express').Router} Router */
/** @typedef {import('express').Response} Response */

/**
 * @template C
 */
const JsonRPCEndpoint = class {

     /** @type {string} */
    #endpoint;
    
    /** @type {{ [name: string]: (res: Response, context: C, params: any) => any|Promise<any> }} */
    #methods = {};

    /**
     * @param {Router} router The Express router to attach the endpoint to.
     * @param {C} context The context object to pass to the method handlers.
     * @param {string} [endpoint] The endpoint path. Default is '/api'.
     */
    constructor(router, context, endpoint = '/api') {
        this.#endpoint = endpoint;
        router.post(this.#endpoint, (req, res) => {
            const { jsonrpc, method, params, id } = req.body || {};

            // Validate JSON-RPC 2.0 request
            if (jsonrpc !== "2.0") {
                return this.reply(res, { id, error: { code: -32600, message: "Invalid Request: 'jsonrpc' must be '2.0'." } });
            }

            if (typeof method !== "string") {
                return this.reply(res, { id, error: { code: -32600, message: "Invalid Request: 'method' must be a string." } });
            }

            const handler = this.#methods[method];
            if (!handler) {
                return this.reply(res, { id, error: { code: -32601, message: "Method not found" } });
            }

            try {
                Promise.resolve(handler(res, context, params))
                    .then(result => {
                        // Before sending, serialize BigInts to strings
                        const safeResult = this.serializeBigInts(result);
                        this.reply(res, { id, result: safeResult });
                    })
                    .catch(err => {
                        this.reply(res, { id, error: { code: err.code || -32603, message: err.message || "Internal error" } });
                    });
            } catch (err) {
                this.reply(res, { id, error: { code: -32603, message: err.message || "Internal error" } });
            }
        });
    }

    /**
     * @param {string} name 
     * @param {(context: C, params: any) => any|Promise<any>} handler 
     */
    addMethod(name, handler) {
        this.#methods[name] = handler;
    }

    /** @returns {string} */
    get endpoint() { return this.#endpoint; }

    /** @returns {{ [name: string]: (res: Response, context: C, params: any) => any|Promise<any> }} */
    get methods() { return this.#methods; }

    /**
     * @param {Response} res
     * @param {{ id?: string|number|null, result?: any, error?: { code: number, message: string, data?: any }}} responsePayload
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
     * Recursively convert BigInt values to strings so they can be JSON-serialized.
     * @param {any} value
     * @returns {any}
     */
    serializeBigInts(value) {
        if (typeof value === 'bigint') {
            return value.toString();
        } else if (Array.isArray(value)) {
            return value.map(v => this.serializeBigInts(v));
        } else if (value && typeof value === 'object') {
            const result = {};
            for (const [key, val] of Object.entries(value)) {
                result[key] = this.serializeBigInts(val);
            }
            return result;
        }
        return value;
    }
}

module.exports = JsonRPCEndpoint;
