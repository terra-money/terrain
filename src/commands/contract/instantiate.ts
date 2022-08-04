import { Command, flags } from '@oclif/command';
import { LCDClient } from '@terra-money/terra.js';
import { loadConfig, loadConnections } from '../../config';
import { instantiate } from '../../lib/deployment';
import { getSigner } from '../../lib/signer';
import * as flag from '../../lib/flag';

export default class ContractInstantiate extends Command {
  static description = 'Instantiate the contract.';

  static flags = {
    signer: flag.signer,
    network: flag.network,
    'set-signer-as-admin': flag.setSignerAsAdmin,
    'instance-id': flags.string({ default: 'default' }),
    'code-id': flags.integer({
      description:
        'specific codeId to instantiate',
    }),
    ...flag.terrainPaths,
  };

  static args = [{ name: 'contract', required: true }];

  async run() {
    const { args, flags } = this.parse(ContractInstantiate);

    const connections = loadConnections(flags['config-path']);
    const config = loadConfig(flags['config-path']);
    const conf = config(flags.network, args.contract);

    // @ts-ignore
    const lcd = new LCDClient(connections(flags.network));
    const signer = getSigner({
      network: flags.network,
      signerId: flags.signer,
      keysPath: flags['keys-path'],
      lcd,
    });

    const admin = flags['set-signer-as-admin']
      ? signer.key.accAddress
      : undefined;

    await instantiate({
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
  }
}
