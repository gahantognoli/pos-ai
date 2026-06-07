import { config } from "./config.ts";
import { OpenRouterService } from "./openrouterService.ts";
import { createServer } from "./server.ts";

const openRouterService = new OpenRouterService(config);
const app = createServer(openRouterService);

await app.listen({ port: config.port, host: "0.0.0.0" });
console.log(`Server is running on http://localhost:${config.port}`);

// app
//   .inject({
//     method: "POST",
//     url: "/chat",
//     payload: {
//       question: "What is the meaning of life?",
//     },
//   })
//   .then((response) => {
//     console.log("Response from /chat:", response.payload);
//   });
