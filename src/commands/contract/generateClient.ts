import { Command, flags } from '@oclif/command';
import { cli } from 'cli-ux';
import { join } from 'path';
import { execSync } from 'child_process';
import { pathExistsSync, copySync } from 'fs-extra';
import { pascal } from 'case';
import TerrainCLI from '../../TerrainCLI';
import runCommand from '../../lib/runCommand';
import generateClient from '../../lib/generateClient';
import defaultErrorCheck from '../../lib/defaultErrorCheck';

export default class GenerateClient extends Command {
  static description = 'Generate a Wallet Provider or Terra.js compatible TypeScript client.';

  static flags = {
    'lib-path': flags.string({ default: 'lib', description: 'location to place the generated client' }),
    dest: flags.string({ default: join('frontend', 'src', 'contract') }),
    'build-schema': flags.boolean({ default: false }),
  };

  static args = [{ name: 'contract', required: true }];

  async run() {
    const { args, flags } = this.parse(GenerateClient);

    // Command execution path.
    const execPath = join('contracts', args.contract);

    // Command to be performed.
    const command = async () => {
      if (flags['build-schema']) {
        cli.action.start('running cargo schema');
        const workingDirectory = process.cwd();
        process.chdir(execPath);
        execSync('cargo schema', { stdio: 'inherit' });

        // Move back to starting point.
        process.chdir(workingDirectory);

        cli.action.stop();
      }

      cli.action.start(
        `Generating ${pascal(args.contract)}Client.ts`,
      );

      await generateClient(
        pascal(args.contract),
        join(execPath, 'schema'),
        join(flags['lib-path'], 'clients'),
      );

      cli.action.stop();

      cli.action.start(
        'Syncing clients to frontend',
      );

      if (!pathExistsSync('frontend')) {
        TerrainCLI.error('The "frontend" directory was not found.', 'Failed to Sync Refs');
        cli.action.stop();
        return;
      }

      copySync(flags['lib-path'], flags.dest);

      cli.action.stop();
    };

    // Attempt to execute command while backtracking through file tree.
    await runCommand(
      execPath,
      command,
      defaultErrorCheck(args.contract),
    );
  }
}
