const path = require("path");
const thisPackage = path.resolve();
const initCwd = process.env.INIT_CWD;
const isCI = process.env.CI === "true";

if (!isCI && initCwd === thisPackage) {
  console.error(`\n❌ Do not run "pnpm install" inside ${thisPackage}`);
  console.error(`➡️  Please run it from the root of the monorepo instead.\n`);
  process.exit(1);
}
