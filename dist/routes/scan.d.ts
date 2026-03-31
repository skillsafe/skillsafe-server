import { Hono } from "hono";
import type { Storage } from "../storage.js";
export declare function scanRoutes(storage: Storage): Hono<import("hono/types").BlankEnv, import("hono/types").BlankSchema, "/">;
