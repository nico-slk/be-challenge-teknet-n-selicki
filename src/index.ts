import { Server } from "./server/server";

const main = () => {
  try {
    const server = new Server();
    server.start();
  } catch (error) {
    console.error('Error starting the server:', error);
  }
};

(async () => {
  main();
})();
