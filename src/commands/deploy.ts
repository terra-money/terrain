import { Command, flags } from '@oclif/command';
import { LCDClient } from '@terra-money/terra.js';
import { loadConfig, loadConnections, loadGlobalConfig } from '../config';
import { instantiate, storeCode } from '../lib/deployment';
import { getSigner } from '../lib/signer';
import * as flag from '../lib/flag';
import SyncRefs from './sync-refs';

export default class Deploy extends Command {
  static description = 'Build wasm bytecode, store code on chain and instantiate.';

  static flags = {
    signer: flag.signer,
    arm64: flag.arm64,
    network: flag.network,
    'no-rebuild': flag.noRebuild,
    'set-signer-as-admin': flag.setSignerAsAdmin,
    'instance-id': flag.instanceId,
    'admin-address': flags.string({
      description: 'set custom address as contract admin to allow migration.',
    }),
    ...flag.terrainPaths,
  };

  static args = [{ name: 'contract', required: true }];

  async run() {
    const { args, flags } = this.parse(Deploy);

    const connections = loadConnections(flags['config-path']);
    const config = loadConfig(flags['config-path']);
    const globalConfig = loadGlobalConfig(flags['config-path']);
    const conf = config(flags.network, args.contract);

    // @ts-ignore
    const lcd = new LCDClient(connections(flags.network));
    const signer = getSigner({
      network: flags.network,
      signerId: flags.signer,
      keysPath: flags['keys-path'],
      lcd,
    });

    // Store sequence to manually increment after code is stored.
    const sequence = await signer.sequence();

    const codeId = await storeCode({
      lcd,
      conf,
      signer,
      noRebuild: flags['no-rebuild'],
      contract: args.contract,
      network: flags.network,
      refsPath: flags['refs-path'],
      arm64: flags.arm64,
      useCargoWorkspace: globalConfig.useCargoWorkspace,
    });

    // pause for account sequence to update.
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((r) => setTimeout(r, 1000));

    const admin = flags['set-signer-as-admin']
      ? signer.key.accAddress
      : flags['admin-address'];

    await instantiate({
      conf,
      signer,
      admin,
      sequence: 1 + sequence,
      contract: args.contract,
      codeId,
      network: flags.network,
      instanceId: flags['instance-id'],
      refsPath: flags['refs-path'],
      lcd,
    });

    await SyncRefs.run([]);
  }
}
