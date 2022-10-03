import { Command } from '@oclif/command';
import { existsSync } from 'fs';
import { join } from 'path';
import { optimize } from '../../lib/deployment';
import { configPath } from '../../lib/flag';
import { loadGlobalConfig } from '../../config';
import TerrainCLI from '../../TerrainCLI';
import runCommand from '../../lib/runCommand';

export default class Optimize extends Command {
  static description = 'Optimize wasm bytecode.';

  static flags = {
    'config-path': configPath,
  };

  static args = [{ name: 'contract', required: true }];

  async run() {
    const { args, flags } = this.parse(Optimize);

    // Command execution path.
    const execPath = flags['config-path'];

    // Command to be performed.
    const command = async () => {
      const globalConfig = loadGlobalConfig(flags['config-path']);

      await optimize({
        contract: args.contract,
        useCargoWorkspace: globalConfig.useCargoWorkspace,
      });
    };

    // Error check to be performed upon each backtrack iteration.
    const errorCheck = () => {
      if (existsSync('contracts') && !existsSync(join('contracts', args.contract))) {
        TerrainCLI.error(
          `Contract "${args.contract}" not available in "contracts/" directory.`,
          'Contract Unavailable',
        );
      }
    };

    // Attempt to execute command while backtracking through file tree.
    await runCommand(
      execPath,
      command,
      errorCheck,
    );
  }
}
