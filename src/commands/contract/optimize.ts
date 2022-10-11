import { Command } from '@oclif/command';
import { optimize } from '../../lib/deployment';
import { configPath } from '../../lib/flag';
import { loadGlobalConfig } from '../../config';
import runCommand from '../../lib/runCommand';
import defaultErrorCheck from '../../lib/defaultErrorCheck';

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

    // Attempt to execute command while backtracking through file tree.
    await runCommand(
      execPath,
      command,
      defaultErrorCheck(args.contract),
    );
  }
}
