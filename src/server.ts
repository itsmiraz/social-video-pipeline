import { createServer } from "http";
import app from "./app";
import { config } from "./config";

const server = createServer(app);

server.listen(config.port, () => {
  console.log(`✅ Server running on http://localhost:${config.port} (${config.nodeEnv})`);
});
