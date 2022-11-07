import { Command, flags } from '@oclif/command';
import { TemplateScaffolding } from '@terra-money/template-scaffolding';
import cli from 'cli-ux';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';
import { pascal } from 'case';
import dedent from 'dedent';
import TerrainCLI from '../TerrainCLI';

export default class New extends Command {
  static description = 'Create new dapp from template.';

  static examples = [
    '$ terrain new awesome-dapp',
    '$ terrain new awesome-dapp --path path/to/dapp',
    '$ terrain new awesome-dapp --path path/to/dapp --authors "ExampleAuthor<example@email.domain>"',
    '$ terrain new awesome-dapp --path path/to/dapp --framework vue --authors "ExampleAuthor<example@email.domain>"',
  ];

  static flags = {
    path: flags.string({
      description: 'Path to create the workspace',
      default: '.',
    }),
    framework: flags.string({
      description:
        'Choose the frontend framework you want to use. Non-react framework options have better wallet-provider support but less streamlined contract integration.',
      options: ['react', 'vue', 'svelte', 'next', 'vite', 'lit'],
      default: 'react',
    }),
    version: flags.string({
      default: '1.0',
    }),
    authors: flags.string({
      default: 'Terra Money <core@terra.money>',
    }),
  };

  static args = [{ name: 'name', required: true }];

  async run() {
    const { args, flags } = this.parse(New);

    const appDir = path.join(process.cwd(), flags.path, args.name);
    const contractDir = path.join(appDir, 'contracts', args.name);
    const frontendDir = path.join(appDir, 'frontend');

    if (fs.existsSync(appDir)) {
      throw Error(
        `Folder '${args.name}' already exists under path '${flags.path}'.\nTip: Use another path or project name`,
      );
    }

    const templateEntries = {
      'project-name': args.name,
      'client-name': `${pascal(args.name)}Client`,
      // Crates cannot have dashes, and Rust will map underscores to dashes for us.
      crate_name: args.name.replaceAll('-', '_'),
      authors: flags.authors,
      ' "now" | date: "%Y" ': `${new Date().getFullYear()}`,
    };

    cli.log(`🚀 Generating app ${args.name}:`);
    cli.action.start('  🛠  Workspace');
    await TemplateScaffolding.from({
      remoteUrl:
        'https://codeload.github.com/terra-money/terrain-core-template/zip/refs/heads/main',
      subFolder: 'terrain-core-template-main',
      localOptions: {
        folderUrl: appDir,
      },
      replace: {
        entries: templateEntries,
      },
    });
    cli.action.stop();

    cli.action.start('  📝 Contract');
    await TemplateScaffolding.from({
      remoteUrl: `https://codeload.github.com/InterWasm/cw-template/zip/refs/heads/${flags.version}`,
      subFolder: `cw-template-${flags.version}`,
      localOptions: {
        folderUrl: contractDir,
      },
      replace: {
        entries: templateEntries,
      },
    });
    cli.action.stop();

    cli.action.start('  💻 Frontend');
    if (flags.framework === 'react') {
      await TemplateScaffolding.from({
        remoteUrl:
          'https://codeload.github.com/terra-money/terrain-frontend-template/zip/refs/heads/main',
        subFolder: 'terrain-frontend-template-main',
        localOptions: {
          folderUrl: frontendDir,
        },
        replace: {
          entries: templateEntries,
        },
      });
    } else {
      await TemplateScaffolding.from({
        remoteUrl:
          'https://codeload.github.com/terra-money/wallet-provider/zip/refs/heads/main',
        subFolder: `wallet-provider-main/templates/${flags.framework}`,
        localOptions: {
          folderUrl: frontendDir,
        },
      });
    }
    cli.action.stop();

    // Install app dependencies.
    process.chdir(appDir);
    cli.action.start('  🏗  Installing app dependencies');
    await execSync('npm i --loglevel error', {
      stdio: ['ignore', 'ignore', 'inherit'],
    });
    cli.action.stop();

    // Install frontend dependencies.
    process.chdir(frontendDir);
    cli.action.start('  🔧 Installing frontend dependencies');
    await execSync('npm i --loglevel error', {
      stdio: ['ignore', 'ignore', 'inherit'],
    });
    cli.action.stop();

    TerrainCLI.success(
      dedent`
      Application "${args.name}" was successfully generated.\n
      Now, you can change into the contract directory:\n
      "cd ${args.name}"\n
      And try to deploy it to your preferred Terra network:\n
      "terrain deploy ${args.name} --signer <signer-wallet> --network" "<desired-network>"\n
      "NOTE:" To deploy your contract to the "LocalTerra" network utilizing the preconfigured test wallet "test1" as the signer, utilize the following command:\n
      "terrain deploy ${args.name}"
    `,
      'Application Generated',
    );
  }
}
