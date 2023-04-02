import { Command } from '@oclif/command';
import * as path from 'path';
import { cli } from 'cli-ux';
import { existsSync } from 'fs';
import * as fs from 'fs-extra';
import { refsPath, frontendRefsPath } from '../lib/flag';
import tesseractCLI from '../tesseractCLI';
import runCommand from '../lib/runCommand';

export default class SyncRefs extends Command {
  static description = 'Sync configuration with frontend app.';

  static flags = {
    'refs-path': refsPath,
    dest: frontendRefsPath,
  };

  async run() {
    const { flags } = this.parse(SyncRefs);

    // Command execution path.
    const execPath = flags.dest;

    // Command to be performed.
    const command = async () => {
      // Append "refs.tesseract.json" to flags.dest path if file unavailable.
      // The fs.copyFileSync command requires the full file path.
      const destFullPath = flags.dest.endsWith('refs.tesseract.json')
        ? flags.dest
        : path.join(flags.dest, 'refs.tesseract.json');

      cli.action.start(
        `Syncing refs from '${flags['refs-path']}' to '${destFullPath}'`,
      );

      fs.copyFileSync(flags['refs-path'], destFullPath);

      cli.action.stop();
    };

    // Error check to be performed upon each backtrack iteration.
    const errorCheck = () => {
      if (existsSync(execPath) && !existsSync('refs.tesseract.json')) {
        tesseractCLI.error(
          'The "refs.tesseract.json" file was not found in the project root directory.',
          'Failed to Sync Refs',
        );
      }
    };

    // Attempt to execute command while backtracking through file tree.
    await runCommand(
      execPath,
      command,
      errorCheck,
    );
  }
}
