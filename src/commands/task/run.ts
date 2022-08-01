import { Command, flags } from '@oclif/command';
import * as path from 'path';
import { cli } from 'cli-ux';
import * as fs from 'fs-extra';
import { Env, getEnv } from '../../lib/env';
import * as flag from '../../lib/flag';
import runScript from '../../lib/runScript';

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
  static summary = 'run predefined task';

  static flags = {
    signer: flag.signer,
    network: flags.string({ default: 'localterra' }),
    'config-path': flags.string({ default: 'config.terrain.json' }),
    'refs-path': flags.string({ default: 'refs.terrain.json' }),
    'keys-path': flags.string({ default: 'keys.terrain.js' }),
  };

  static args = [{ name: 'task' }];

  static fromCwd = (p: string) => path.join(process.cwd(), p);

  async run() {
    const { args, flags } = this.parse(Run);
    let scriptPath = Run.fromCwd(`tasks/${args.task}.ts`);

    if (!fs.existsSync(scriptPath)) {
      scriptPath = Run.fromCwd(`tasks/${args.task}.js`);
    }

    await new Promise<void | Error>((resolve, reject) => {
      runScript(
        scriptPath,
        {
          configPath: Run.fromCwd(flags['config-path']),
          keysPath: Run.fromCwd(flags['keys-path']),
          refsPath: Run.fromCwd(flags['refs-path']),
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
}
