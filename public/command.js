const socket = io("/");
function printoutput(msg) {
  console.log(msg);
  var logArea = document.getElementById("logs");
  logArea.innerHTML += "\n" + msg;
  logArea.scrollTop = logArea.scrollHeight;
}

var requestedProcesses = [];
function updateProcDetails(procid, proc) {
  var toProceed = true;
  var table = document.getElementById("process_table");
  requestedProcesses.forEach((process) => {
    if (process.id === procid) {
      const index = requestedProcesses.indexOf(process);
      requestedProcesses[index] = proc;
      var tr = document.getElementById("proc_" + procid);
      if (tr) {
        var html = `<td>${procid}</td><td>${proc.filename}</td><td>${proc.args}</td><td>${proc.workingDir}</td><td>output</td><td>${proc.status}</td>`;
        tr.innerHTML = html;
      } else {
        var html = `<tr id="proc_${procid}"><td>${procid}</td><td>${proc.filename}</td><td>${proc.args}</td><td>${proc.workingDir}</td><td>output</td><td>${proc.status}</td></tr>`;
        table.innerHTML += html;
      }
      toProceed = false;
    }
  });
  if (toProceed) {
    requestedProcesses.push(proc);
    var html = `<tr id="proc_${procid}"><td>${procid}</td><td>${proc.filename}</td><td>${proc.args}</td><td>${proc.workingDir}</td><td>output</td><td>${proc.status}</td></tr>`;
    table.innerHTML += html;
  }
}

socket.on("connect", () => {
  printoutput("Socket connection established.");

  var intervalledThinge = setInterval(() => {
    socket.emit("proc_det");
  }, 1000);
  socket.on("proc_det", (proc_det_str) => {
    let proc_det = JSON.parse(proc_det_str);
    proc_det.forEach((proc) => {
      updateProcDetails(proc.id, proc);
    });
  });
  socket.on("proc_details", (procid, proc_details) => {
    updateProcDetails(procid, JSON.parse(proc_details));
  });
  socket.on("executor_not_open", (error) => {
    printoutput(`The executor is not available due to the error: ${error}`);
  });
  socket.on("proc_details", (procid, procdet) => {
    updateProcDetails(procid, JSON.parse(procdet)[0]);
  });
  socket.on("executeproc_success", (procid) => {
    printoutput(`The process ${procid} has been started`);
  });
  socket.on("executeproc_error", (error) => {
    printoutput(`Error while executing process: ${error.message}`);
  });
  socket.on("executeproc_stderr", (procid, stderr) => {
    printoutput(`[${procid}] [STDERR] ${stderr}`);
  });
  socket.on("executeproc_stdout", (procid, stdout) => {
    printoutput(`[${procid}] [STDOUT] ${stdout}`);
  });
  socket.on("executeproc_exit", (procid, code) => {
    printoutput(`The process ${procid} exited with code: ${code}`);
  });
  socket.on("failtocloseproc", (procid, code) => {
    printoutput(
      `Failed to close the process ${procid}, server error code: ${code}`
    );
  });
  socket.on("successtostartproc", (procid) => {
    printoutput(`Started the process ${procid}`);
  });
  socket.on("failtostartproc", (procid, error) => {
    printoutput(`Failed to start the process ${procid}, error: ${error}`);
  });
  socket.on("message", (msg) => {
    printoutput(msg);
  });
  socket.on("disconnect", function () {
    clearInterval(intervalledThinge);
    printoutput("Disconnected from socket");
  });
});
function executeProcess(filename, args, workingDir) {
  requestedProcesses.push({
    filename: filename,
    args: args,
    workingDir: workingDir
  });
  socket.emit("executeproc", filename, args, workingDir);
}
function execCmdBtnClicked() {
  executeProcess(
    document.getElementById("filename").value,
    document.getElementById("args").value,
    document.getElementById("workingDir").value
  );
}
function execShutdownByTimeBtnClicked() {
  var cmd =
    "shutdown /s /t" +
    document.getElementById("timer").value +
    " /c" +
    document.getElementById("power_msg").value;
  executeProcess(cmd);
}
function execShutdownWarnBtnClicked() {
  var cmd = "shutdown /p /c" + document.getElementById("power_msg").value;
  executeProcess(cmd);
}
function execShutdownForceBtnClicked() {
  var cmd = "shutdown /s /f /c " + document.getElementById("power_msg").value;
  executeProcess(cmd);
}

function execRestartByTimeBtnClicked() {
  var cmd =
    "shutdown /r /t" +
    document.getElementById("timer").value +
    " /c" +
    document.getElementById("power_msg").value;
  executeProcess(cmd);
}
function execRestartWarnBtnClicked() {
  var cmd = "shutdown /r /p /c" + document.getElementById("power_msg").value;
  executeProcess(cmd);
}
function execRestartForceBtnClicked() {
  var cmd = "shutdown /r /f /c " + document.getElementById("power_msg").value;
  executeProcess(cmd);
}
function sendPopup(title, msg) {
  socket.emit(
    "showpopup",
    title,
    msg,
    document.getElementById("iconselect").selectedIndex,
    document.getElementById("btnselect").selectedIndex
  );
}
function showPopupMessage() {
  sendPopup(
    document.getElementById("popuptit").value,
    document.getElementById("popupmsg").value
  );
}
