import { Hono } from "hono";
import type { Storage } from "./storage.js";
export declare function createApp(storage: Storage, token: string | null): Hono;
