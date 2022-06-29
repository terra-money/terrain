import { Command, flags } from '@oclif/command';
import { cli } from 'cli-ux';
import * as fs from 'fs-extra';
import capitalize from '../lib/capitalize';
import TerrainCLI from '../TerrainCLI';
import generateClient from '../lib/generateClient';

export default class SyncRefs extends Command {
  static description = 'Sync configuration with frontend app.';

  static flags = {
    'lib-path': flags.string({ default: './lib', description: 'location to place the generated client' }),
    dest: flags.string({ default: './frontend/src/contract' }),
  };

  static args = [{ name: 'file' }];

  async run() {
    const { args, flags } = this.parse(SyncRefs);

    cli.action.start(
      `generating ${capitalize(args.contract)}Client.ts`,
    );

    await generateClient(capitalize(args.contract), `./contracts/${args.contract}/schema`, './lib/clients');

    cli.action.stop();

    if (!fs.pathExistsSync('./frontend')) {
      TerrainCLI.warning('no frontend directory found, not syncing refs');
    }
  }
}
