import * as childProcess from 'child_process';
import TerrainCLI from '../TerrainCLI';

async function runScript(
  scriptPath: string,
  env: {
    configPath: string;
    keysPath: string;
    refsPath: string;
    network: string;
    signer: string;
  },
): Promise<void | Error> {
  // Create child process.
  const child = childProcess.fork(
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

  // Evaluate result of child process.
  child.on('exit', (code) => {
    if (code === 1) {
      TerrainCLI.error(`Exit code ${code}.`);
    }
  });
}

export default runScript;
