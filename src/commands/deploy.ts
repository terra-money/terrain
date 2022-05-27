import { Command, flags } from '@oclif/command';
import { LCDClient } from '@terra-money/terra.js';
import * as fs from 'fs';
import { loadConfig, loadConnections } from '../config';
import { instantiate, storeCode } from '../lib/deployment';
import { getSigner } from '../lib/signer';

export default class Deploy extends Command {
  static description = 'Build wasm bytecode, store code on chain and instantiate.';

  static flags = {
    'no-rebuild': flags.boolean({
      description: 'deploy the wasm bytecode as is.',
      default: false,
    }),
    network: flags.string({ default: 'localterra' }),
    'config-path': flags.string({ default: './config.terrain.json' }),
    'refs-path': flags.string({ default: './refs.terrain.json' }),
    'keys-path': flags.string({ default: './keys.terrain.js' }),
    'instance-id': flags.string({ default: 'default' }),
    signer: flags.string({ required: true }),
    'set-signer-as-admin': flags.boolean({
      description: 'set signer (deployer) as admin to allow migration.',
      default: false,
    }),
    'admin-address': flags.string({
      description: 'set custom address as contract admin to allow migration.',
    }),
    'frontend-refs-path': flags.string({
      default: './frontend/src/refs.terrain.json',
    }),
    arm64: flags.boolean({
      description: 'use rust-optimizer-arm64 for optimization. Not recommended for production, but it will optimize quicker on arm64 hardware during development.',
      default: false,
    }),
  };

  static args = [{ name: 'contract', required: true }];

  async run() {
    const { args, flags } = this.parse(Deploy);

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
    });

    // pause for account sequence to update.
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

    fs.copyFileSync(flags['refs-path'], flags['frontend-refs-path']);
  }
}
