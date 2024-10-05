require("dotenv").config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";


import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Connect to the Neon database
const sql = neon(process.env.DATABASE_URL);

// creating drizzle instance
export const db = drizzle(sql, { schema });
