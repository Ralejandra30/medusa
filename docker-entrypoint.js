async function main() {
  const { default: start } = require("@medusajs/medusa/commands/start")

  await start({
    directory: process.cwd(),
    port: parseInt(process.env.PORT || "9000"),
  })
}

main().catch((err) => {
  console.error("Failed to start Medusa server:", err)
  process.exit(1)
})
