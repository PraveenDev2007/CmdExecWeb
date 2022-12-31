class StdOutput {
  constructor(procid) {
    this.procid = procid;
    this.stdout = "";
    this.stderr = "";
    this.log = "";
  }
  addStdOut(data) {
    this.stdout += data.toString();
    this.log += `[STDOUT] ${data.toString()}`;
  }
  addStdErr(data) {
    this.stderr += data.toString();
    this.log += `[STDERR] ${data.toString()}`;
  }
  addStdOutput(out, err) {
    this.stdout += out.toString();
    this.stderr += err.toString();
    this.log += `[STDOUT] ${out.toString()}`;
    this.log += `[STDERR] ${err.toString()}`;
  }
}
exports.StdOutput = StdOutput;
exports.ProcessManager = class {
  processes = [];
  stdoutputs = [];
  createNewProcess(procid, filename, args, workingDir, status) {
    var newProcess = {
      id: procid,
      filename: filename,
      args: args,
      workingDir: workingDir,
      status: status
    };
    this.processes.push(newProcess);
    this.stdoutputs.push(new StdOutput(procid));
  }

  getProcessess(procid) {
    let retProc = [];
    this.processes.forEach((process) => {
      if (process.id === procid) {
        retProc.push(process);
      }
    });
    return retProc;
  }
  getProcessessByFilename(filename) {
    let retProc = [];
    this.processes.forEach((process) => {
      if (process.filename === filename) {
        retProc.push(process);
      }
    });
    return retProc;
  }
  getProcessessByArgs(args) {
    let retProc = [];
    this.processes.forEach((process) => {
      if (process.args === args) {
        retProc.push(process);
      }
    });
    return retProc;
  }
  getProcessessByWorkingDir(workingDir) {
    let retProc = [];
    this.processes.forEach((process) => {
      if (process.workingDir === workingDir) {
        retProc.push(process);
      }
    });
    return retProc;
  }
  getProcessessByStatus(status) {
    let retProc = [];
    this.processes.forEach((process) => {
      if (process.status === status) {
        retProc.push(process);
      }
    });
    return retProc;
  }
  removeProcess(procid) {
    this.processes.forEach((process) => {
      if (process.id === procid) {
        const index = this.processes.indexOf(process);
        this.processes.splice(index, 1);
      }
    });
  }
  removeProcessByFilename(filename) {
    this.processes.forEach((process) => {
      if (process.filename === filename) {
        const index = this.processes.indexOf(process);
        this.processes.splice(index, 1);
      }
    });
  }
  removeProcessByArgs(args) {
    this.processes.forEach((process) => {
      if (process.args === args) {
        const index = this.processes.indexOf(process);
        this.processes.splice(index, 1);
      }
    });
  }
  removeProcessByWorkingDir(workingDir) {
    this.processes.forEach((process) => {
      if (process.workingDir === workingDir) {
        const index = this.processes.indexOf(process);
        this.processes.splice(index, 1);
      }
    });
  }
  removeProcessByStatus(status) {
    this.processes.forEach((process) => {
      if (process.status === status) {
        const index = this.processes.indexOf(process);
        this.processes.splice(index, 1);
      }
    });
  }
  updateProcessByProcId(
    procid,
    newProcid,
    newFilename,
    newArgs,
    newWorkingDir,
    newStatus
  ) {
    this.processes.forEach((process) => {
      if (process.id === procid) {
        const index = this.processes.indexOf(process);

        this.processes[index].id = newProcid;
        this.processes[index].filename = newFilename;
        this.processes[index].args = newArgs;
        this.processes[index].workingDir = newWorkingDir;
        this.processes[index].status = newStatus;
      }
    });
  }
  updateProcessByFileName(
    filename,
    newProcid,
    newFileName,
    newArgs,
    newWorkingDir,
    newStatus
  ) {
    this.processes.forEach((process) => {
      if (process.filename === filename) {
        const index = this.processes.indexOf(process);

        this.processes[index].id = newProcid;
        this.processes[index].filename = newFileName;
        this.processes[index].args = newArgs;
        this.processes[index].workingDir = newWorkingDir;
        this.processes[index].status = newStatus;
      }
    });
  }
  updateProcessByArgs(
    args,
    newProcid,
    newFileName,
    newArgs,
    newWorkingDir,
    newStatus
  ) {
    this.processes.forEach((process) => {
      if (process.args === args) {
        const index = this.processes.indexOf(process);

        this.processes[index].id = newProcid;
        this.processes[index].filename = newFileName;
        this.processes[index].newArgs = newArgs;
        this.processes[index].workingDir = newWorkingDir;
        this.processes[index].status = newStatus;
      }
    });
  }
  updateProcessByWorkingDir(
    workingDir,
    newProcid,
    newFileName,
    newArgs,
    newWorkingDir,
    newStatus
  ) {
    this.processes.forEach((process) => {
      if (process.workingDir === workingDir) {
        const index = this.processes.indexOf(process);

        this.processes[index].id = newProcid;
        this.processes[index].filename = newFileName;
        this.processes[index].newArgs = newArgs;
        this.processes[index].workingDir = newWorkingDir;
        this.processes[index].status = newStatus;
      }
    });
  }
  updateProcessByStatus(
    status,
    newProcid,
    newFileName,
    newArgs,
    newWorkingDir,
    newStatus
  ) {
    this.processes.forEach((process) => {
      if (process.status === status) {
        const index = this.processes.indexOf(process);

        this.processes[index].id = newProcid;
        this.processes[index].filename = newFileName;
        this.processes[index].newArgs = newArgs;
        this.processes[index].workingDir = newWorkingDir;
        this.processes[index].status = newStatus;
      }
    });
  }
  getStdOutput(procid) {
    this.stdoutputs.forEach((stdoutput) => {
      if (stdoutput.procid === procid) {
        return stdoutput;
      }
    });
  }
  addStdOut(procid, data) {
    var stdoutput = this.getStdOutput(procid);
    stdoutput.addStdOut(data);
  }
  addStdErr(procid, data) {
    var stdoutput = this.getStdOutput(procid);
    stdoutput.addStdErr(data);
  }
  addStdOutput(procid, out, err) {
    var stdoutput = this.getStdOutput(procid);
    stdoutput.addStdOutput(out, err);
  }
};
