import { Command } from '@oclif/command';
import { join } from 'path';
import dedent from 'dedent';
import { build } from '../../lib/deployment';
import * as flag from '../../lib/flag';
import runCommand from '../../lib/runCommand';
import defaultErrorCheck from '../../lib/defaultErrorCheck';
import TerrainCLI from '../../TerrainCLI';

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

    // Message to be displayed upon successful command execution.
    const successMessage = () => {
      TerrainCLI.success(
        dedent`
      The Wasm bytecode for contract "${args.contract}" was successfully generated.\n
      The next step is to optimize the Wasm bytecode:\n
      "terrain contract:optimize ${args.contract}"\n
      "NOTE:" Make sure that "Docker" is installed and running in the background before attempting to optimize the Wasm bytecode.
    `,
        'Wasm Bytecode Generated',
      );
    };

    // Attempt to execute command while backtracking through file tree.
    await runCommand(
      execPath,
      command,
      defaultErrorCheck(args.contract),
      successMessage,
    );
  }
}
