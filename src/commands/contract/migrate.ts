import { Command, flags } from '@oclif/command';
import { LCDClient } from '@terra-money/terra.js';
import { loadContractConfig, loadConnections } from '../../config';
import {
  migrate, storeCode, build, optimize,
} from '../../lib/deployment';
import { getSigner } from '../../lib/signer';
import * as flag from '../../lib/flag';

export default class ContractMigrate extends Command {
  static description = 'Migrate the contract.';

  static flags = {
    signer: flag.signer,
    arm64: flag.arm64,
    // "no-rebuild": flag.noRebuild,
    build: flag.build,
    network: flags.string({ default: 'localterra' }),
    'config-path': flags.string({ default: './config.terrain.json' }),
    'refs-path': flags.string({ default: './refs.terrain.json' }),
    'keys-path': flags.string({ default: './keys.terrain.js' }),
    'instance-id': flags.string({ default: 'default' }),
    'code-id': flags.integer({
      description: 'target code id for migration',
    }),
    workspace: flags.string({ default: undefined }),
  };

  static args = [{ name: 'contract', required: true }];

  async run() {
    const { args, flags } = this.parse(ContractMigrate);

    const connections = loadConnections(flags['config-path']);
    const config = loadContractConfig(flags['config-path']);
    const conf = config(flags.network, args.contract);

    // @ts-ignore
    const lcd = new LCDClient(connections(flags.network));
    const signer = getSigner({
      network: flags.network,
      signerId: flags.signer,
      keysPath: flags['keys-path'],
      lcd,
    });

    if (flags.build) {
      await build({
        contract: args.contract,
        workspace: flags.workspace,
      });
      await optimize({
        contract: args.contract,
        workspace: flags.workspace,
        arm64: flags.arm64,
      });
    }

    const codeId = await storeCode({
      conf,
      contract: args.contract,
      workspace: flags.workspace,
      signer,
      network: flags.network,
      refsPath: flags['refs-path'],
      lcd,
      arm64: flags.arm64,
    });

    migrate({
      conf,
      signer,
      contract: args.contract,
      codeId,
      network: flags.network,
      instanceId: flags['instance-id'],
      refsPath: flags['refs-path'],
      lcd,
    });
  }
}
