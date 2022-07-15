import { Command } from '@oclif/command';
import { cli } from 'cli-ux';
import * as fs from 'fs-extra';
import { refsPath, frontendRefsPath } from '../lib/flag';

export default class SyncRefs extends Command {
  static description = 'Sync configuration with frontend app.';

  static flags = {
    'refs-path': refsPath,
    dest: frontendRefsPath,
  };

  async run() {
    const { flags } = this.parse(SyncRefs);

    if (!fs.pathExistsSync(flags.dest)) {
      cli.error('destination directory not found, not syncing refs');
    }

    // fs.copyFileSync requires the full path to copy to so lets
    // append "refs.terrain.json" if it doesn't exist.
    const destFullPath = flags.dest.endsWith('refs.terrain.json')
      ? flags.dest
      : `${flags.dest.replace(/\/$/, '')}/refs.terrain.json`;

    cli.action.start(
      `syncing refs from '${flags['refs-path']}' to '${destFullPath}'`,
    );

    fs.copyFileSync(flags['refs-path'], destFullPath);

    cli.action.stop();
  }
}
