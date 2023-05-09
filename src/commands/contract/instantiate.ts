import { Command, flags } from '@oclif/command';
import dedent from 'dedent';
import { LCDClient } from '@terra-money/feather.js';
import { loadConfig, loadConnections } from '../../config';
import { instantiate } from '../../lib/deployment';
import { getSigner } from '../../lib/signer';
import * as flag from '../../lib/flag';
import runCommand from '../../lib/runCommand';
import defaultErrorCheck from '../../lib/defaultErrorCheck';
import TerrainCLI from '../../TerrainCLI';

export default class ContractInstantiate extends Command {
  static description = 'Instantiate the contract.';

  static flags = {
    'instance-id': flag.instanceId,
    'code-id': flag.codeId,
    ...flag.tx,
    ...flag.terrainPaths,
  };

  static args = [{ name: 'contract', required: true }];

  async run() {
    const { args, flags } = this.parse(ContractInstantiate);

    let contractAddress: string;
    let admin: string;

    // Command execution path.
    const execPath = flags['config-path'];

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

      admin = signer.key.accAddress(flags.prefix);

      contractAddress = await instantiate({
        conf,
        signer,
        admin,
        contract: args.contract,
        codeId: flags['code-id'],
        network: flags.network,
        instanceId: flags['instance-id'],
        refsPath: flags['refs-path'],
        configPath: flags['config-path'],
        lcd,
        prefix: flags.prefix,
      });
    };

    // Message to be displayed upon successful command execution.
    const terraNetwork = flags.network === 'local'
      ? 'local network'
      : `${flags.network[0].toUpperCase()}${flags.network.substring(1)}`;
    const successMessage = () => {
      TerrainCLI.success(
        dedent`
        Contract "${args.contract}" was successfully instantiated on "${terraNetwork}".\n
        Contract Address: "${contractAddress}"\n
        Administrator: "${admin}"
      `,
        'Contract Instantiated',
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
