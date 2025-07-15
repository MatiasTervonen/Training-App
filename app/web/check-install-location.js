const path = require("path");
const thisPackage = path.resolve(); // Gets the current directory where script runs
const initCwd = process.env.INIT_CWD; // Where the user ran `pnpm install` from

if (initCwd === thisPackage) {
  console.error(`\n❌ Do not run "pnpm install" inside ${thisPackage}`);
  console.error(`➡️  Please run it from the root of the monorepo instead.\n`);
  process.exit(1);
}
