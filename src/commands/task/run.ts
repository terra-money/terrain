import { Command, flags } from '@oclif/command';
import { join } from 'path';
import { cli } from 'cli-ux';
import { existsSync } from 'fs';
import { Env, getEnv } from '../../lib/env';
import * as flag from '../../lib/flag';
import runScript from '../../lib/runScript';
import runCommand from '../../lib/runCommand';
import TerrainCLI from '../../TerrainCLI';

export const task = async (fn: (env: Env) => Promise<void>) => {
  try {
    await fn(
      getEnv(
        process.env.configPath || '',
        process.env.keysPath || '',
        process.env.refsPath || '',
        process.env.network || '',
        process.env.signer || '',
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
    signer: flag.signer,
    network: flags.string({ default: 'localterra' }),
    'config-path': flags.string({ default: 'config.terrain.json' }),
    'refs-path': flags.string({ default: 'refs.terrain.json' }),
    'keys-path': flags.string({ default: 'keys.terrain.js' }),
  };

  static args = [{ name: 'task' }];

  async run() {
    const { args, flags } = this.parse(Run);

    // Command execution path.
    const execPath = join('tasks', `${args.task}.ts`);

    // Command to be performed.
    const command = async () => new Promise<void | Error>((resolve, reject) => {
      runScript(
        execPath,
        {
          configPath: join(process.cwd(), flags['config-path']),
          keysPath: join(process.cwd(), flags['keys-path']),
          refsPath: join(process.cwd(), flags['refs-path']),
          network: flags.network,
          signer: flags.signer,
        },
        (err) => {
          if (err) reject(err);
          resolve();
        },
      );
    });

    // Error check to be performed upon each backtrack iteration.
    const errorCheck = async () => {
      if (existsSync('tasks') && !existsSync(execPath)) {
        const jsExecutablePath = join('tasks', `${args.task}.js`);
        if (existsSync(jsExecutablePath)) {
          return new Promise<void | Error>((resolve, reject) => {
            runScript(
              jsExecutablePath,
              {
                configPath: join(process.cwd(), flags['config-path']),
                keysPath: join(process.cwd(), flags['keys-path']),
                refsPath: join(process.cwd(), flags['refs-path']),
                network: flags.network,
                signer: flags.signer,
              },
              (err) => {
                if (err) reject(err);
                resolve();
              },
            );
          });
        }
        TerrainCLI.error(
          `Task '${args.task}' not available in 'tasks/' directory.`,
        );
      }
      return null;
    };

    // Attempt to execute command while backtracking through file tree.
    await runCommand(
      execPath,
      command,
      errorCheck,
    );
  }
}
