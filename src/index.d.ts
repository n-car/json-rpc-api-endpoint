// JsonRPCEndpoint.d.ts

import type { Router, Request, Response } from "express";

/**
 * Definiamo il tipo della funzione "handler" che aggiungiamo tramite `addMethod`.
 */
type JSONRPCHandler<C> = (req: Request, context: C, params: any) => any | Promise<any>;

interface JSONRPCError {
  code: number;
  message: string;
  data?: any;
}

interface JSONRPCResponsePayload {
  id?: string | number | null;
  result?: any;
  error?: JSONRPCError;
}

/**
 * La classe che stai esportando dal tuo modulo.
 * Il generics `<C>` rappresenta il "context" (vedi il tuo @template C).
 */
declare class JsonRPCEndpoint<C> {
  /**
   * Costruttore.
   * 
   * @param router   - Un oggetto Express.Router
   * @param context  - Oggetto generico che verrà passato ai metodi
   * @param endpoint - Path su cui risponderà alle chiamate JSON-RPC (default: "/api")
   */
  constructor(router: Router, context: C, endpoint?: string);

  /**
   * Restituisce il path dell'endpoint, ad es. "/api".
   */
  get endpoint(): string;

  /**
   * Restituisce la mappa di tutti i metodi registrati.
   */
  get methods(): { [methodName: string]: JSONRPCHandler<C> };

  /**
   * Aggiunge un metodo JSON-RPC (p.es. "getUserData").
   * 
   * @param name    - Nome del metodo
   * @param handler - Funzione handler che riceve (req, context, params)
   */
  addMethod(name: string, handler: JSONRPCHandler<C>): void;

  /**
   * Serve gli script client (per chiamare JSON-RPC dal browser).
   * 
   * @param router - Un oggetto Express.Router
   * @param url    - Path da cui servire gli script (default: "/vendor/json-rpc-api-client")
   */
  static serveScripts(router: Router, url?: string): void;

  /**
   * Invia una risposta JSON-RPC 2.0 al client.
   */
  reply(res: Response, responsePayload: JSONRPCResponsePayload): void;

  /**
   * Serializza ricorsivamente BigInt e Date in formati stringa sicuri per JSON.
   */
  serializeBigIntsAndDates(value: any): any;

  /**
   * Deserializza ricorsivamente stringhe che rappresentano BigInt e Date
   * (prodotte da `serializeBigIntsAndDates`) per ricostruire i tipi originali.
   */
  deserializeBigIntsAndDates(value: any): any;
}

/**
 * Dato che in JS usi `module.exports = JsonRPCEndpoint;`,
 * in TypeScript la dichiarazione corrispondente è `export = ...`.
 */
export = JsonRPCEndpoint;
