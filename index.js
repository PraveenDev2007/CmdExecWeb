const express = require("express");
const app = express();
const server = require("http").Server(app);
const ioServer = require("socket.io")(server);
const { v4: uuidV4 } = require("uuid");
const mysql = require("mysql2");
const net = require("net");
const port = parseInt(process.env.PORT) || 8080;
const cmdexec = require("./cmdexec");
const processManagerScript = require("./processmanager.js");
const procmanager = new processManagerScript.ProcessManager();

function isValidPort(_port) {
  if (_port == null) {
    return false;
  }
  if (_port < 0 || _port > 65535) {
    return false;
  }
  if (_port < 1024) {
    return false;
  }
  return net.isPortTaken(_port);
}
const connDetails = {
  host: "db4free.net",
  user: "cmdexec",
  password: "cmdexec@javabool2022",
  database: "cmdexec"
};
const connection = mysql.createConnection({
  host: connDetails.host,
  user: connDetails.user,
  password: connDetails.password,
  database: connDetails.database
});
async function prepareHttpServer() {
  try {
    app.set("view engine", "ejs");
    app.use(express.static("public"));

    app.get("/", (req, res) => {
      res.render("home");
    });
  } catch (error) {
    throw error;
  }
}
let executor;
async function consituteSocketIOServer() {
  try {
    executor = new cmdexec.Executor(connDetails);
    executor.start();
    executor.tryopen().catch((error) => {
      console.log(`Failed to open connection to the executor due to ${error}`);
      ioServer.emit("executor_not_open", error);
    });
    executor.on("successtostartproc", (procid) => {
      let proc = procmanager.getProcessess(procid)[0];
      procmanager.updateProcessByProcId(
        procid,
        procid,
        proc.filename,
        proc.args,
        proc.workingDir,
        "open"
      );
      console.log(`[${procid}] Started the process`);
      ioServer.emit("successtostartproc", procid);
    });
    executor.on("failtostartproc", (procid, error) => {
      let proc = procmanager.getProcessess(procid)[0];
      procmanager.updateProcessByProcId(
        procid,
        procid,
        proc.filename,
        proc.args,
        proc.workingDir,
        "closed"
      );
      console.log(`[${procid}] Failed to start the process. ${error}`);
      ioServer.emit("failtostartproc", procid, error);
    });
    executor.on("proc_stdout", (procid, data) => {
      procmanager.addStdOut(procid, data);
      console.log(`[${procid}] [STDOUT] ${data}`);
      ioServer.emit("executeproc_stdout", procid, data);
    });
    executor.on("proc_stderr", (procid, data) => {
      procmanager.addStdErr(procid, data);
      console.log(`[${procid}] [STDERR] ${data}`);
      ioServer.emit("executeproc_stderr", procid, data);
    });
    executor.on("proc_exit", (procid, exitCode) => {
      let proc = procmanager.getProcessess(procid)[0];
      procmanager.updateProcessByProcId(
        procid,
        procid,
        proc.filename,
        proc.args,
        proc.workingDir,
        "closed"
      );
      console.log(procmanager.getProcessess(procid)[0].status);
      console.log(`[${procid}] The process exited with code ${exitCode}`);
      ioServer.emit("executeproc_exit", procid, exitCode);
    });
    executor.on("failtocloseproc", (procid, exitCode) => {
      let proc = procmanager.getProcessess(procid)[0];
      procmanager.updateProcessByProcId(
        procid,
        procid,
        proc.filename,
        proc.args,
        proc.workingDir,
        "closed"
      );
      console.log(`[${procid}] Failed to close the process: error ${exitCode}`);
      ioServer.to(procid).emit("failtocloseproc", procid, exitCode);
    });
    ioServer.on("connection", (socket) => {
      socket.on("proc_det", () => {
        socket.emit("proc_det", JSON.stringify(procmanager.processes));
      });
      socket.on("proc_details", (procid) => {
        let proc = procmanager.getProcessess(procid);
        socket.emit("proc_details", procid, JSON.stringify(proc));
      });
      socket.on("showpopup", (title, msg, icon, button) => {
        executor
          .tryopen()
          .then(() => {
            if (executor.isOpen()) {
              executor.showPopup(
                title,
                msg,
                executor.getIcon(icon),
                executor.getButton(button)
              );
            } else {
              socket.emit("executor_not_open", "Unknown error");
            }
          })
          .catch((error) => {
            socket.emit("executor_not_open", error.message);
          });
      });
      socket.on("executeproc", (filename, args, workingDir) => {
        let procid = uuidV4();
        if (workingDir === undefined || workingDir === null) {
          workingDir = "";
        }
        procmanager.createNewProcess(
          procid,
          filename,
          args,
          workingDir,
          "opening"
        );
        executor
          .tryopen()
          .then(() => {
            if (executor.isOpen()) {
              executor.doExecuteProc(procid, filename, args, workingDir);
            } else {
              socket.emit("executor_not_open", "");
            }
          })
          .catch((error) => {
            socket.emit("executor_not_open", error.message);
          });
      });
      socket.on("closeprocess", (procid) => {
        let proc = procmanager.getProcessess(procid)[0];
        procmanager.updateProcessByProcId(
          procid,
          procid,
          proc.filename,
          proc.args,
          proc.workingDir,
          "closed"
        );
        executor
          .tryopen()
          .then(() => {
            if (executor.isOpen()) {
              executor.closeprocess(procid);
            } else {
              socket.emit("executor_not_open", "");
            }
          })
          .catch((error) => {
            socket.emit("executor_not_open", error.message);
          });
      });
    });
  } catch (error) {
    console.error("Error constituting socket: " + error.message);
    throw error;
  }
}
async function updateDatabase() {
  try {
    let url = "https://ypm6z6.sse.codesandbox.io/";
    connection.connect((error) => {
      if (error) {
        console.error("MySQL connection failed: " + error);
      } else {
        //console.log("Connected to MySQL");
        const currentDateTime = new Date()
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");
        var queryStr = `UPDATE weburl SET url = '${url}', timecreated = '${currentDateTime}' WHERE id = 1`;
        //console.log("Executing query: " + queryStr);
        connection.query(queryStr, (error, results, fields) => {
          if (error) {
            console.error("Error while updating mysql for url: " + error);
          } else {
            console.log("Success updating mysql.");
          }
        });
        connection.end();
      }
    });
  } catch (error) {
    console.error(`Error starting ngrok: ${error}`);
  }
}
try {
  prepareHttpServer()
    .then(() => {
      consituteSocketIOServer()
        .then(() => {
          server.listen(port);
          updateDatabase();
        })
        .catch((error) => {
          console.error(`Failed to setup socket.io: ${error.message}`);
        });
    })
    .catch((error) => {
      console.error(`Failed to launch http server: ${error}`);
    });
} catch (uncaughtError) {
  console.error("Uncaught exception: " + uncaughtError);
}
/*
var http = require("http");

//create a server object:
http
  .createServer(function (req, res) {
    res.write("Hello World!"); //write a response to the client
    res.end(); //end the response
  })
  .listen(8080); //the server object listens on port 8080
*/
