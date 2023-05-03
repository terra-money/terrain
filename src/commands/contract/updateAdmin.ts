import { Command, flags } from '@oclif/command';
import * as YAML from 'yaml';
import { LCDClient, MsgUpdateContractAdmin } from '@terra-money/feather.js';
import { cli } from 'cli-ux';
import { loadConnections, loadRefs } from '../../config';
import { getSigner } from '../../lib/signer';
import * as flag from '../../lib/flag';
import runCommand from '../../lib/runCommand';
import defaultErrorCheck from '../../lib/defaultErrorCheck';

export default class ContractUpdateAdmin extends Command {
  static description = 'Update the admin of a contract.';

  static flags = {
    ...flag.tx,
    'instance-id': flag.instanceId,
    ...flag.terrainPaths,
  };

  static args = [
    { name: 'contract', required: true },
    { name: 'admin', required: true },
  ];

  async run() {
    const { args, flags } = this.parse(ContractUpdateAdmin);
    // Command execution path.
    const execPath = flags['config-path'];

    // Command to be performed.
    const command = async () => {
      const connections = loadConnections(flags['config-path'], flags.prefix);
      const refs = loadRefs(flags['refs-path']);
      const { network } = flags;
      const connection = connections(network);

      const { chainID } = connection;
      const lcd = new LCDClient({ [chainID]: connection });

      const signer = await getSigner({
        network: flags.network,
        signerId: flags.signer,
        keysPath: flags['keys-path'],
        lcd,
        configPath: flags['config-path'],
        prefix: flags.prefix,
      });

      const contractAddress = refs[network][args.contract].contractAddresses[flags['instance-id']];

      cli.action.start(
        `Updating contract admin to: ${args.admin}`,
      );

      const updateAdminTx = await signer.createAndSignTx({
        chainID,
        msgs: [
          new MsgUpdateContractAdmin(
            signer.key.accAddress(flags.prefix),
            args.admin,
            contractAddress,
          ),
        ],
      });

      const res = await lcd.tx.broadcast(updateAdminTx, chainID);

      cli.action.stop();

      if (res) {
        cli.log(YAML.stringify(JSON.parse(res.raw_log)));
      } else {
        cli.error('Transaction not included in block before timeout.');
      }
    };

    // Attempt to execute command while backtracking through file tree.
    await runCommand(
      execPath,
      command,
      defaultErrorCheck(args.contract),
    );
  }
}
