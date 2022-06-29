import { Command, flags } from '@oclif/command';
import { cli } from 'cli-ux';
import * as fs from 'fs-extra';

export default class SyncRefs extends Command {
  static description = 'Sync configuration with frontend app.';

  static flags = {
    'refs-path': flags.string({ default: './refs.terrain.json' }),
    dest: flags.string({ default: './frontend/src/refs.terrain.json' }),
  };

  static args = [{ name: 'file' }];

  async run() {
    const { flags } = this.parse(SyncRefs);

    if (!fs.pathExistsSync('./frontend')) {
      cli.info('no frontend directory found, not syncing refs');
    }

    cli.action.start(
      `syncing refs from '${flags['refs-path']}' to '${flags.dest}`,
    );

    fs.copyFileSync(flags['refs-path'], flags.dest);

    cli.action.stop();
  }
}
