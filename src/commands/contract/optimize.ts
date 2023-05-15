import { Command } from '@oclif/command';
import dedent from 'dedent';
import { optimize } from '../../lib/deployment';
import { CONFIG_PATH, loadGlobalConfig } from '../../config';
import runCommand from '../../lib/runCommand';
import defaultErrorCheck from '../../lib/defaultErrorCheck';
import TerrainCLI from '../../TerrainCLI';

export default class Optimize extends Command {
  static description = 'Optimize wasm bytecode.';

  static args = [{ name: 'contract', required: true }];

  async run() {
    const { args } = this.parse(Optimize);

    // Command to be performed.
    const command = async () => {
      const globalConfig = loadGlobalConfig();

      await optimize({
        contract: args.contract,
        useCargoWorkspace: globalConfig.useCargoWorkspace,
      });
    };

    // Message to be displayed upon successful command execution.
    const successMessage = () => {
      TerrainCLI.success(
        dedent`
        The Wasm bytecode for contract "${args.contract}" was successfully optimized.\n
        The next step is to store the Wasm bytecode on a Terra network:\n
        "terrain contract:store ${args.contract} --signer <signer-wallet>" "--network <desired-network>"\n
        "NOTE:" To store your contract on the "LocalTerra" network utilizing the preconfigured test wallet "test1" as the signer, use the following command:\n
        "terrain contract:store ${args.contract}"
      `,
        'Wasm Bytecode Optimized',
      );
    };

    // Attempt to execute command while backtracking through file tree.
    await runCommand(
      CONFIG_PATH,
      command,
      defaultErrorCheck(args.contract),
      successMessage,
    );
  }
}
