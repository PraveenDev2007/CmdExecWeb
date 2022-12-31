const net = require("net");
const mysql = require("mysql2");

function getLatestExecUrl(host, user, password, database) {
  return new Promise((resolve, reject) => {
    const connection = mysql.createConnection({
      host: host,
      user: user,
      password: password,
      database: database
    });

    connection.on("error", function (error) {
      return reject(error);
    });

    connection.connect();

    connection.query("SELECT * FROM ngrokurl WHERE id = 1", function (
      error,
      results,
      fields
    ) {
      connection.end();
      if (error) {
        return reject(error);
      }
      return resolve(results[0].url);
    });
  });
}
function getLatestExecutorUrl(connDetails) {
  return getLatestExecUrl(
    connDetails.host,
    connDetails.user,
    connDetails.password,
    connDetails.database
  );
}
exports.getLatestExecutorUrl = function (connDetails) {
  return getLatestExecutorUrl(connDetails);
};
exports.Executor = class {
  constructor(_sqlConnDetails) {
    this.sqlConnDetails = _sqlConnDetails;
    this.events = {};
    this.client = new net.Socket();
  }
  getIcon(code) {
    if (code === null || code === undefined || code <= 0 || code >= 4) {
      return "INFORMATION";
    }
    if (code === 1) {
      return "QUESTION";
    }
    if (code === 2) {
      return "WARNING";
    }
    if (code === 3) {
      return "ERROR";
    }
    return "INFORMATION";
  }
  getButton(code) {
    if (code === null || code === undefined || code <= 0 || code >= 7) {
      return "OK";
    }
    if (code === 1) {
      return "OKCANCEL";
    }
    if (code === 2) {
      return "RETRYCANCEL";
    }
    if (code === 3) {
      return "YESNO";
    }
    if (code === 4) {
      return "YESNOCANCEL";
    }
    if (code === 5) {
      return "ABORTRETRYIGNORE";
    }
    if (code === 6) {
      return "CANCELTRYCONTINUE";
    }
    return "OK";
  }
  isOpen() {
    return this.client.readyState === "open";
  }
  isOpening() {
    return this.client.readyState === "opening";
  }
  isClosing() {
    return this.client.readyState === "closing";
  }
  isClosed() {
    return this.client.readyState === "closed";
  }
  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
  }
  trigger(eventName, ...args) {
    const callbacks = this.events[eventName];

    if (callbacks) {
      callbacks.forEach((callback) => callback(...args));
    }
  }
  parseDataAndExecute(packet) {
    if (packet === undefined || packet === null) {
      return;
    }
    if (packet.function_name === undefined || packet.function_name === null) {
      return;
    }
    var function_name = packet.function_name;
    switch (function_name) {
      case "successtostartproc":
        this.trigger("successtostartproc", packet.parameters.procid);
        break;
      case "failtostartproc":
        this.trigger(
          "failtostartproc",
          packet.parameters.procid,
          packet.parameters.error
        );
        break;
      case "proc_stdout":
        this.trigger(
          "proc_stdout",
          packet.parameters.procid,
          packet.parameters.data
        );
        break;
      case "proc_stderr":
        this.trigger(
          "proc_stderr",
          packet.parameters.procid,
          packet.parameters.data
        );
        break;
      case "proc_exit":
        this.trigger(
          "proc_exit",
          packet.parameters.procid,
          packet.parameters.exitCode
        );
        break;
      case "failtocloseproc":
        this.trigger(
          "failtocloseproc",
          packet.parameters.procid,
          packet.parameters.errcode
        );
        break;
      default:
        break;
    }
  }
  start() {
    getLatestExecutorUrl(this.sqlConnDetails)
      .then((url) => {
        var splittedUrl = url.split(":");
        var host = splittedUrl[0];
        var port = splittedUrl[1];
        this.client.connect(
          {
            host: host,
            port: port
          },
          () => {
            console.log("Connected to executor");
          }
        );
        this.registerEvents();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
  tryopenwithip(host, port) {
    return new Promise((resolve, reject) => {
      try {
        this.client = new net.Socket();
        this.client.connect(
          {
            host: host,
            port: port
          },
          () => {
            console.log("Connected to executor");
          }
        );
        this.registerEvents();
        return resolve();
      } catch (error) {
        return reject(error);
      }
    });
  }
  tryopen() {
    return new Promise((resolve, reject) => {
      console.log(
        "Trying to reopen with latest url, checking if the connection exists"
      );
      if (this.isClosed()) {
        console.log(
          "Connection is closed. Attempting to reopen with latest url"
        );
        getLatestExecutorUrl(this.sqlConnDetails)
          .then((url) => {
            var splittedUrl = url.split(":");
            var host = splittedUrl[0];
            var port = splittedUrl[1];
            this.tryopenwithip(host, port)
              .then(() => {
                return resolve();
              })
              .catch((error) => {
                return reject(error);
              });
          })
          .catch((error) => {
            return reject(error);
          });
      } else if (this.isOpen()) {
        console.log("Connection is already open! ");
        return resolve();
      } else if (this.isClosing()) {
        return reject(new Error("The connection to executor is closing"));
      } else if (this.isOpening()) {
        console.log("Connection is connecting to the executor ");
        return resolve();
      } else {
        console.log("Impossible call!");
        return reject("Check the code. This is impossible to trigger.");
      }
    });
  }
  registerEvents() {
    try {
      this.client.on("data", (data) => {
        let packet = JSON.parse(data.toString());
        this.parseDataAndExecute(packet);
      });
      this.client.on("close", () => {
        console.log("Executor connection closed.");
        this.tryopen().catch((error) => {
          console.log(`Failed to reconnect to the executor ${error}`);
        });
      });
      this.client.on("error", (error) => {
        console.log("Error from executor: " + error.message);
      });
    } catch (error) {
      console.error(
        "Error occured while establishing connection to PC: " + error
      );
    }
  }
  send(dataStr) {
    this.tryopen().then(() => {
      let data = Buffer.from(dataStr, "utf-8");
      this.client.write(data);
    });
  }
  close() {
    this.client.end();
  }
  doExecuteProc(procid, filename, args, workingDir) {
    var jObj = {
      function_name: "executeproc",
      parameters: {
        procid: procid,
        filename: filename,
        args: args,
        workingDir: workingDir
      }
    };
    this.send(JSON.stringify(jObj));
  }
  showPopup(title, msg, icon, button) {
    var jObj = {
      function_name: "showpopup",
      parameters: {
        title: title,
        msg: msg,
        icon: icon,
        button: button
      }
    };
    this.send(JSON.stringify(jObj));
  }
  closeprocess(procid) {
    var jObj = {
      function_name: "closeprocess",
      parameters: {
        procid: procid
      }
    };
    this.send(JSON.stringify(jObj));
  }
};
