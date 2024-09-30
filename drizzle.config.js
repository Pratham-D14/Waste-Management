require("dotenv").config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export default {
  dialect: "postgresql",
  schema: "./utils/database/schema.ts",
  out: "./drizzle",

  dbCredentials: {
    url: process.env.DATABASE_URL,
    connectionString: process.env.DATABASE_URL,
  },
};
