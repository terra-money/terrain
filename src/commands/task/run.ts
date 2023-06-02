import { Command } from '@oclif/command';
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
        process.env.keysPath || '',
        process.env.refsPath || '',
        process.env.network || '',
        process.env.prefix || '',
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
    ...flag.tx,
    ...flag.terrainPaths,
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
          keysPath: join(process.cwd(), flags['keys-path']),
          refsPath: join(process.cwd(), flags['refs-path']),
          network: flags.network,
          prefix: flags.prefix,
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
        console.log('fisrt if');
        const jsExecutablePath = join('tasks', `${args.task}.js`);
        if (existsSync(jsExecutablePath)) {
          return new Promise<void | Error>((resolve, reject) => {
            runScript(
              jsExecutablePath,
              {
                keysPath: join(process.cwd(), flags['keys-path']),
                refsPath: join(process.cwd(), flags['refs-path']),
                network: flags.network,
                prefix: flags.prefix,
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
          `Task "${args.task}" not available in "tasks" directory.`,
          'Task Not Found',
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
