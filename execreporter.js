const net = require("net");
exports.ExecReport = class {
  constructor(executor) {
    this.server = new net.createServer();
    this.server.on("connection", (socket) => {
      socket.on("data", (data) => {
        var ip = data.toString();
        var splittedUrl = ip.split(":");
        var host = splittedUrl[0];
        var port = splittedUrl[1];
        executor.tryopenwithip(host, port).catch((error) => {
          console.error(error.message);
        });
      });
      socket.on("close", (hadError) => {
        if (hadError) {
          console.error("Socket had error while closing...");
        }
      });
    });
    this.server.on("error", (error) => {
      console.error(error.message);
    });
  }
};
