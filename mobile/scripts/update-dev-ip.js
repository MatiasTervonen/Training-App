/* global __dirname */
// Updates EXPO_PUBLIC_API_URL_DEV in .env with the current LAN IP
// Runs automatically before Expo starts via the "start" script

const os = require("os");
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env");

function getLanIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal && !name.includes("WSL")) {
        return iface.address;
      }
    }
  }
  return null;
}

const ip = getLanIp();
if (!ip) {
  console.log("Could not detect LAN IP, skipping .env update");
  process.exit(0);
}

const url = `http://${ip}:3000`;

let content = fs.readFileSync(envPath, "utf-8");
if (content.includes("EXPO_PUBLIC_API_URL_DEV=")) {
  content = content.replace(
    /EXPO_PUBLIC_API_URL_DEV=.*/,
    `EXPO_PUBLIC_API_URL_DEV=${url}`
  );
} else {
  content += `\nEXPO_PUBLIC_API_URL_DEV=${url}\n`;
}

fs.writeFileSync(envPath, content);
console.log(`Updated EXPO_PUBLIC_API_URL_DEV=${url}`);
