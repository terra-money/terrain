import { Command, flags } from '@oclif/command';
import { cli } from 'cli-ux';
import { execSync } from 'child_process';
import * as fs from 'fs-extra';
import { pascal } from 'case';
import TerrainCLI from '../../TerrainCLI';
import generateClient from '../../lib/generateClient';

export default class GenerateClient extends Command {
  static description = 'Generate a Wallet Provider or Terra.js compatible TypeScript client.';

  static flags = {
    'lib-path': flags.string({ default: './lib', description: 'location to place the generated client' }),
    dest: flags.string({ default: './frontend/src/contract' }),
    'build-schema': flags.boolean({ default: false }),
  };

  static args = [{ name: 'contract', required: true }];

  async run() {
    const { args, flags } = this.parse(GenerateClient);
    const contractPath = `contracts/${args.contract}`;

    if (flags['build-schema']) {
      cli.action.start('running cargo schema');
      const workingDirectory = process.cwd();
      process.chdir(contractPath);
      execSync('cargo schema', { stdio: 'inherit' });

      // Move back to starting point.
      process.chdir(workingDirectory);

      cli.action.stop();
    }

    cli.action.start(
      `generating ${pascal(args.contract)}Client.ts`,
    );

    await generateClient(pascal(args.contract), `./contracts/${args.contract}/schema`, `${flags['lib-path']}/clients`);

    cli.action.stop();

    cli.action.start(
      'syncing clients to frontend',
    );

    if (!fs.pathExistsSync('./frontend')) {
      TerrainCLI.warning('no frontend directory found, not syncing refs');
      cli.action.stop();
      return;
    }

    fs.copySync(flags['lib-path'], flags.dest);

    cli.action.stop();
  }
}
