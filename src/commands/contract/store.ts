import { Command, flags } from '@oclif/command';
import dedent from 'dedent';
import { LCDClient } from '@terra-money/feather.js';
import { existsSync } from 'fs';
import { join } from 'path';
import { loadConfig, loadConnections } from '../../config';
import { storeCode } from '../../lib/deployment';
import { getSigner } from '../../lib/signer';
import * as flag from '../../lib/flag';
import TerrainCLI from '../../TerrainCLI';
import runCommand from '../../lib/runCommand';

export default class CodeStore extends Command {
  static description = 'Store code on chain.';

  static flags = {
    ...flag.tx,
    'no-rebuild': flag.noRebuild,
    'code-id': flag.codeId,
    ...flag.terrainPaths,
  };

  static args = [{ name: 'contract', required: true }];

  async run() {
    const { args, flags } = this.parse(CodeStore);

    // Command execution path.
    const execPath = flags['config-path'];

    // Command to be performed.
    const command = async () => {
      const connections = loadConnections(flags['config-path'], flags.prefix);
      const config = loadConfig(flags['config-path']);
      const conf = config(flags.network, args.contract);
      const connection = connections(flags.network);

      const lcd = new LCDClient({ [connection.chainID]: connection });
      const signer = await getSigner({
        network: flags.network,
        signerId: flags.signer,
        keysPath: flags['keys-path'],
        lcd,
        configPath: flags['config-path'],
        prefix: flags.prefix,
      });

      await storeCode({
        conf,
        noRebuild: flags['no-rebuild'],
        contract: args.contract,
        signer,
        network: flags.network,
        refsPath: flags['refs-path'],
        lcd,
        codeId: flags['code-id'],
        prefix: flags.prefix,
        configPath: flags['config-path'],
      });
    };

    // Error check to be performed upon each backtrack iteration.
    const errorCheck = () => {
      if (
        existsSync('contracts')
        && !existsSync(join('contracts', args.contract))
      ) {
        TerrainCLI.error(
          `Contract "${args.contract}" not available in "contracts" directory.`,
          'Contract Unavailable',
        );
      }
    };

    // Message to be displayed upon successful command execution.
    const network = flags.network === 'local'
      ? 'local network'
      : `${flags.network[0].toUpperCase()}${flags.network.substring(1)}`;
    const successMessage = () => {
      TerrainCLI.success(
        dedent`
        The Wasm bytecode for contract "${args.contract}" was successfully stored on "${network}".\n
        The next step is to instantiate the contract:\n
        "terrain contract:instantiate ${args.contract} --signer <signer-wallet>" "--network <desired-network>"\n
        "NOTE:" To instantiate your contract on the "LocalTerra" network utilizing the preconfigured test wallet "test1" as the signer, use the following command:\n
        "terrain contract:instantiate ${args.contract}"
      `,
        'Wasm Bytecode Stored',
      );
    };

    // Attempt to execute command while backtracking through file tree.
    await runCommand(execPath, command, errorCheck, successMessage);
  }
}
