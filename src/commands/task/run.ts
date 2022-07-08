import { Command, flags } from '@oclif/command';
import * as path from 'path';
import * as childProcess from 'child_process';
import { cli } from 'cli-ux';
import * as fs from 'fs-extra';
import { Env, getEnv } from '../../lib/env';

export const task = async (fn: (env: Env) => Promise<void>) => {
  try {
    await fn(
      getEnv(
        process.env.configPath || '',
        process.env.keysPath || '',
        process.env.refsPath || '',
        process.env.network || '',
      ),
    );
  } catch (err) {
    if (err instanceof Error) {
      cli.error(err);
    }
    if (typeof err === 'string') {
      cli.error(err);
    }

    cli.error(`${err}`);
  }
};

export default class Run extends Command {
  static description = 'run predefined task';

  static flags = {
    network: flags.string({ default: 'localterra' }),
    'config-path': flags.string({ default: 'config.terrain.json' }),
    'refs-path': flags.string({ default: 'refs.terrain.json' }),
    'keys-path': flags.string({ default: 'keys.terrain.js' }),
  };

  static args = [{ name: 'task' }];

  fromCwd = (p: string) => path.join(process.cwd(), p);

  async run() {
    const { args, flags } = this.parse(Run);
    let scriptPath = this.fromCwd(`tasks/${args.task}.ts`);

    if (!fs.existsSync(scriptPath)) {
      scriptPath = this.fromCwd(`tasks/${args.task}.js`);
    }

    runScript(
      scriptPath,
      {
        configPath: this.fromCwd(flags['config-path']),
        keysPath: this.fromCwd(flags['keys-path']),
        refsPath: this.fromCwd(flags['refs-path']),
        network: flags.network,
      },
      (err) => {
        if (err) throw err;
      },
    );
  }
}

function runScript(
  scriptPath: string,
  env: {
    configPath: string;
    keysPath: string;
    refsPath: string;
    network: string;
  },
  callback: (err?: Error) => void,
) {
  // keep track of whether callback has been invoked to prevent multiple invocations
  let invoked = false;

  const cProcess = childProcess.fork(
    scriptPath,
    {
      env: {
        ...process.env,
        ...env,
      },
      execArgv: ['-r', 'ts-node/register'],
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
}
