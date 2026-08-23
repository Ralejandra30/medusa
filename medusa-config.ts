import { defineConfig } from "@medusajs/utils"

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    databaseSchema: process.env.DATABASE_SCHEMA || "public",
  },
  http: {
    storeCors: process.env.STORE_CORS || "http://localhost:8000",
    adminCors: process.env.ADMIN_CORS || "http://localhost:7001",
    authCors: process.env.AUTH_CORS || "http://localhost:7001,http://localhost:8000",
  },
})
