import { Command, flags } from '@oclif/command';
import { TemplateScaffolding } from '@terra-money/template-scaffolding';
import cli from 'cli-ux';
import * as path from 'path';
import * as fs from 'fs-extra';
import Zip from 'adm-zip';
import * as request from 'superagent';
import { execSync } from 'child_process';

export default class New extends Command {
  static description = 'Create new dapp from a template.';

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
      description: 'Choose the frontend framework you want to use. Non-react framework options have better wallet-provider support but less streamlined contract integration.',
      options: ['react', 'vue', 'svelte', 'next', 'vite', 'lit'],
      default: 'react',
    }),
    version: flags.string({
      default: '0.16',
    }),
    authors: flags.string({
      default: 'Terra Money <core@terra.money>',
    }),
  };

  static args = [{ name: 'name', required: true }];

  async run() {
    const { args, flags } = this.parse(New);

    if (fs.existsSync(path.join(flags.path, args.name))) {
      throw Error(`Folder '${args.name}' already exists under path '${flags.path}'.\nTip: Use another path or project name`);
    }

    const templateEntries = {
      'project-name': args.name,
      crate_name: args.name,
      authors: flags.authors,
      ' "now" | date: "%Y" ': `${new Date().getFullYear()}`,
    };

    cli.log(`generating app ${args.name}:`);
    cli.action.start('- workspace');
    await TemplateScaffolding.from({
      remoteUrl: 'https://codeload.github.com/terra-money/terrain-core-template/zip/refs/heads/main',
      subFolder: 'terrain-core-template-main',
      localOptions: {
        folderUrl: path.join(process.cwd(), flags.path, args.name),
      },
      replace: {
        entries: templateEntries,
      },
    });
    cli.action.stop();
    process.chdir('..');

    cli.action.start('- frontend');
    if (flags.framework === 'react') {
      await new Promise((resolve, reject) => {
        const file = fs.createWriteStream('frontend.zip');
        request
          .get(
            'https://github.com/terra-money/terrain-frontend-template/archive/refs/heads/main.zip',
          )
          .on('error', (error) => {
            reject(error);
          })
          .pipe(file)
          .on('finish', () => {
            cli.action.stop();
            resolve(null);
          });
      });
      const zip = new Zip('frontend.zip');
      zip.extractAllTo('.', true);
      fs.renameSync('terrain-frontend-template-main', 'frontend');
      fs.removeSync('frontend.zip');
    } else {
      execSync(
        `npx copy-github-directory https://github.com/terra-money/wallet-provider/tree/main/templates/${flags.framework} frontend`,
      );
      process.chdir('frontend');
      fs.removeSync('sandbox.config.json');
    }

    cli.action.start('- contract');
    await TemplateScaffolding.from({
      remoteUrl: `https://codeload.github.com/InterWasm/cw-template/zip/refs/heads/${flags.version}`,
      subFolder: `cw-template-${flags.version}`,
      localOptions: {
        folderUrl: path.join(process.cwd(), flags.path, args.name, 'contracts', args.name),
      },
      replace: {
        entries: templateEntries,
      },
    });
    cli.action.stop();

    cli.action.start('- frontend');
    if (flags.framework === 'react') {
      await TemplateScaffolding.from({
        remoteUrl: 'https://codeload.github.com/terra-money/terrain-frontend-template/zip/refs/heads/main',
        subFolder: 'terrain-frontend-template-main',
        localOptions: {
          folderUrl: path.join(process.cwd(), flags.path, args.name, 'frontend'),
        },
        replace: {
          entries: templateEntries,
        },
      });
    } else {
      await TemplateScaffolding.from({
        remoteUrl: 'https://codeload.github.com/terra-money/wallet-provider/zip/refs/heads/main',
        subFolder: `wallet-provider-main/templates/${flags.framework}`,
        localOptions: {
          folderUrl: path.join(process.cwd(), flags.path, args.name, 'frontend'),
        },
      });
    }
    cli.action.stop();
  }
}
