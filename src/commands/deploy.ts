import { Command, flags } from '@oclif/command';
import dedent from 'dedent';
import { LCDClient } from '@terra-money/feather.js';
import {
  loadConfig, loadConnections, loadGlobalConfig, CONFIG_FILE_NAME as execPath,
} from '../config';
import { instantiate, storeCode } from '../lib/deployment';
import { getSigner } from '../lib/signer';
import * as flag from '../lib/flag';
import runCommand from '../lib/runCommand';
import defaultErrorCheck from '../lib/defaultErrorCheck';
import TerrainCLI from '../TerrainCLI';

export default class Deploy extends Command {
  static description = 'Build wasm bytecode, store code on chain and instantiate.';

  static flags = {
    memo: flag.memo,
    'no-rebuild': flag.noRebuild,
    'instance-id': flag.instanceId,
    'frontend-refs-path': flag.frontendRefsPath,
    'admin-address': flags.string({
      description: 'set custom address as contract admin to allow migration.',
    }),
    'no-sync': flags.string({
      description: "don't attempt to sync contract refs to frontend.",
    }),
    ...flag.tx,
    ...flag.terrainPaths,
  };

  static args = [{ name: 'contract', required: true }];

  async run() {
    const { args, flags } = this.parse(Deploy);
    const globalConfig = loadGlobalConfig();

    let contractAddress: string;
    let admin: string;

    const command = async () => {
      const connections = loadConnections(flags.prefix);
      const config = loadConfig();
      const conf = config(flags.network, args.contract);
      const connection = connections(flags.network);

      const lcd = new LCDClient({ [connection.chainID]: connection });
      const signer = await getSigner({
        network: flags.network,
        signerId: flags.signer,
        keysPath: flags['keys-path'],
        lcd,
        prefix: flags.prefix,
      });

      if (conf.deployTask) {
        await this.config.runCommand('task:run', [
          conf.deployTask,
          '--signer',
          flags.signer,
          '--network',
          flags.network,
          '--refs-path',
          flags['refs-path'],
          '--keys-path',
          flags['keys-path'],
        ]);
      } else {
        // Store sequence to manually increment after code is stored.
        const sequence = await signer.sequence(connection.chainID);
        const codeId = await storeCode({
          lcd,
          conf,
          signer,
          noRebuild: flags['no-rebuild'],
          contract: args.contract,
          network: flags.network,
          refsPath: flags['refs-path'],
          useCargoWorkspace: globalConfig.useCargoWorkspace,
          prefix: flags.prefix,
          memo: flags.memo,
        });

        // pause for account sequence to update.
        // eslint-disable-next-line no-promise-executor-return
        await new Promise((r) => setTimeout(r, 1000));

        admin = flags['admin-address']
          ? flags['admin-address']
          : signer.key.accAddress(flags.prefix);

        contractAddress = await instantiate({
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
          prefix: flags.prefix,
          memo: flags.memo,
        });
      }

      await this.config.runCommand('contract:generateClient', [args.contract]);

      if (!flags['no-sync']) {
        await this.config.runCommand('sync-refs', [
          '--refs-path',
          flags['refs-path'],
          '--dest',
          flags['frontend-refs-path'],
        ]);
      }
    };

    // Message to be displayed upon successful command execution.
    const successMessage = () => {
      TerrainCLI.success(
        dedent`
        Contract "${args.contract}" has been successfully deployed on "${flags.network}".\n
        Contract Address: "${contractAddress}"\n
        Administrator: "${admin}"
      `,
        'Contract Deployed',
      );
    };

    await runCommand(
      execPath,
      command,
      defaultErrorCheck(args.contract),
      successMessage,
    );
  }
}
