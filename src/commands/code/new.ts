import { Command, flags } from '@oclif/command';
import { cli } from 'cli-ux';
import { TemplateScaffolding } from '@terra-money/template-scaffolding';
import * as path from 'path';
import * as fs from 'fs';

export default class CodeNew extends Command {
  static description = 'Generate new contract.';

  static examples = [
    '$ terrain code:new awesome_contract',
    '$ terrain code:new awesome_contract --path path/to/dapp',
    '$ terrain code:new awesome_contract --path path/to/dapp --authors "ExampleAuthor<example@email.domain>"',
  ];

  static flags = {
    path: flags.string({
      description: 'path to keep the contracts',
      default: './contracts',
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
    const { args, flags } = this.parse(CodeNew);

    if(fs.existsSync(path.join(flags.path, args.name))) { 
      throw Error(`Folder '${args.name}' already exists under path '${flags.path}'.\nTip: Use another path or contract name`);
    }

    cli.log(`generating contract ${args.name}:`);
    cli.action.start('- contract');
    await TemplateScaffolding.from({
      remoteUrl: `https://codeload.github.com/InterWasm/cw-template/zip/refs/heads/${flags.version}`,
      subFolder: `cw-template-${flags.version}`,
      localOptions: {
        folderUrl: path.join(process.cwd(), flags.path, args.name, "contracts", args.name)
      },
      replace: {
        entries: {
          "project-name": args.name,
          "crate_name": args.name,
          "authors": flags.authors,
          " \"now\" | date: \"%Y\" ": `${new Date().getFullYear()}`
        }
      }
    });
    cli.action.stop();
  }
}
