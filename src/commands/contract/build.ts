import { Command } from '@oclif/command';
import { join } from 'path';
import { build } from '../../lib/deployment';
import * as flag from '../../lib/flag';
import runCommand from '../../lib/runCommand';
import defaultErrorCheck from '../../lib/defaultErrorCheck';

export default class Build extends Command {
  static description = 'Build wasm bytecode.';

  static flags = {
    'config-path': flag.configPath,
  };

  static args = [{ name: 'contract', required: true }];

  async run() {
    const { args } = this.parse(Build);

    // Command execution path.
    const execPath = join('contracts', args.contract);

    // Command to be performed.
    const command = async () => {
      await build({
        contract: args.contract,
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
