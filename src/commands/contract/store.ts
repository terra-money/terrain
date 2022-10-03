import { Command, flags } from '@oclif/command';
import { LCDClient } from '@terra-money/terra.js';
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
    signer: flag.signer,
    network: flag.network,
    'no-rebuild': flag.noRebuild,
    'code-id': flags.integer({}),
    ...flag.terrainPaths,
  };

  static args = [{ name: 'contract', required: true }];

  async run() {
    const { args, flags } = this.parse(CodeStore);

    // Command execution path.
    const execPath = flags['config-path'];

    // Command to be performed.
    const command = async () => {
      const connections = loadConnections(flags['config-path']);
      const config = loadConfig(flags['config-path']);
      const conf = config(flags.network, args.contract);

      const lcd = new LCDClient(connections(flags.network));
      const signer = await getSigner({
        network: flags.network,
        signerId: flags.signer,
        keysPath: flags['keys-path'],
        lcd,
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
