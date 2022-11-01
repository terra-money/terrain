import { Command, flags } from '@oclif/command';
import dedent from 'dedent';
import { LCDClient } from '@terra-money/terra.js';
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
    signer: flag.signer,
    network: flag.network,
    'instance-id': flags.string({ default: 'default' }),
    'code-id': flags.integer({
      description: 'specific codeId to instantiate',
    }),
    ...flag.terrainPaths,
  };

  static args = [{ name: 'contract', required: true }];

  async run() {
    const { args, flags } = this.parse(ContractInstantiate);

    // Initialize variables.
    let contractAddress: string;
    let admin: string;

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

      admin = signer.key.accAddress;

      contractAddress = await instantiate({
        conf,
        signer,
        admin,
        contract: args.contract,
        codeId: flags['code-id'],
        network: flags.network,
        instanceId: flags['instance-id'],
        refsPath: flags['refs-path'],
        lcd,
      });
    };

    // Message to be displayed upon successful command execution.
    const terraNetwork = flags.network === 'localterra'
      ? 'LocalTerra'
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
