import { Command } from '@oclif/command';
import * as path from 'path';
import { cli } from 'cli-ux';
import * as fs from 'fs-extra';
import { refsPath, frontendRefsPath } from '../lib/flag';
import TerrainCLI from '../TerrainCLI';

export default class SyncRefs extends Command {
  static description = 'Sync configuration with frontend app.';

  static flags = {
    'refs-path': refsPath,
    dest: frontendRefsPath,
  };

  async run() {
    const { flags } = this.parse(SyncRefs);

    if (!fs.pathExistsSync(flags.dest)) {
      TerrainCLI.error(`Failed to sync refs. Destination directory '${flags.dest}' not found.`);
    }

    // Append "refs.terrain.json" to flags.dest path if file unavailable.
    // The fs.copyFileSync command requires the full file path.
    const destFullPath = flags.dest.endsWith('refs.terrain.json')
      ? flags.dest
      : path.join(flags.dest, 'refs.terrain.json');

    cli.action.start(
      `Syncing refs from '${flags['refs-path']}' to '${destFullPath}'`,
    );

    fs.copyFileSync(flags['refs-path'], destFullPath);

    cli.action.stop();
  }
}
