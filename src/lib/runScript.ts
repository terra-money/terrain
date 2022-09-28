import * as childProcess from 'child_process';

export default (
  scriptPath: string,
  env: {
    configPath: string;
    keysPath: string;
    refsPath: string;
    network: string;
    signer: string;
  },
  callback: (err?: Error) => void,
) => {
  // keep track of whether callback has been invoked to prevent multiple invocations
  let invoked = false;

  const cProcess = childProcess.fork(
    scriptPath,
    {
      env: {
        ...process.env,
        ...env,
        TS_NODE_COMPILER_OPTIONS: '{"module":"commonjs", "esModuleInterop": true, "moduleResolution": "node"}',
      },
      execArgv: [
        '--no-warnings',
        '--loader',
        'ts-node/esm/transpile-only',
      ],
    },
  );

  // listen for errors as they may prevent the exit event from firing
  cProcess.on('error', (err) => {
    if (invoked) return;
    invoked = true;
    callback(err);
  });

  // execute the callback once the process has finished running
  cProcess.on('exit', (code) => {
    if (invoked) return;
    invoked = true;
    const err = code === 0 ? undefined : new Error(`exit code ${code}`);
    callback(err);
  });
};
