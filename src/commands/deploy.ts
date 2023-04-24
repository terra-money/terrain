import { Command, flags } from '@oclif/command';
import dedent from 'dedent';
import { LCDClient } from '@terra-money/feather.js';
import { loadConfig, loadConnections, loadGlobalConfig } from '../config';
import { instantiate, storeCode } from '../lib/deployment';
import { getSigner } from '../lib/signer';
import * as flag from '../lib/flag';
import runCommand from '../lib/runCommand';
import defaultErrorCheck from '../lib/defaultErrorCheck';
import TerrainCLI from '../TerrainCLI';

export default class Deploy extends Command {
  static description = 'Build wasm bytecode, store code on chain and instantiate.';

  static flags = {
    signer: flag.signer,
    network: flag.network,
    'no-rebuild': flag.noRebuild,
    'instance-id': flag.instanceId,
    'frontend-refs-path': flag.frontendRefsPath,
    'admin-address': flags.string({
      description: 'set custom address as contract admin to allow migration.',
    }),
    'no-sync': flags.string({
      description: "don't attempt to sync contract refs to frontend.",
    }),
    ...flag.terrainPaths,
  };

  static args = [{ name: 'contract', required: true }];

  async run() {
    const { args, flags } = this.parse(Deploy);

    // initialize variables.
    let contractAddress: string;
    let admin: string;

    // Command execution path.
    const execPath = 'config.terrain.json';

    // Command to be performed.
    const command = async () => {
      const connections = loadConnections(flags['config-path']);
      const config = loadConfig(flags['config-path']);
      const globalConfig = loadGlobalConfig(flags['config-path']);
      const conf = config(flags.network, args.contract);

      const lcd = new LCDClient(connections(flags.network));
      const signer = await getSigner({
        network: flags.network,
        signerId: flags.signer,
        keysPath: flags['keys-path'],
        lcd,
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
          '--config-path',
          flags['config-path'],
          '--keys-path',
          flags['keys-path'],
        ]);
      } else {
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
          useCargoWorkspace: globalConfig.useCargoWorkspace,
        });

        // pause for account sequence to update.
        // eslint-disable-next-line no-promise-executor-return
        await new Promise((r) => setTimeout(r, 1000));

        admin = flags['admin-address']
          ? flags['admin-address']
          : signer.key.accAddress;

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
    const terraNetwork = flags.network === 'localterra'
      ? 'LocalTerra'
      : `${flags.network[0].toUpperCase()}${flags.network.substring(1)}`;
    const successMessage = () => {
      TerrainCLI.success(
        dedent`
        Contract "${args.contract}" has been successfully deployed on "${terraNetwork}".\n
        Contract Address: "${contractAddress}"\n
        Administrator: "${admin}"
      `,
        'Contract Deployed',
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
