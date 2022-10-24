import { Command, flags } from '@oclif/command';
import { cli } from 'cli-ux';
import { TemplateScaffolding } from '@terra-money/template-scaffolding';
import { join } from 'path';
import { existsSync } from 'fs';
import TerrainCLI from '../../TerrainCLI';
import runCommand from '../../lib/runCommand';

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
      default: 'contracts',
    }),
    commitHash: flags.string({
      default: '9fa5b9b38fca4f99239ac28be48a6e1f0a4d30c8',
    }),
    authors: flags.string({
      default: 'Terra Money <core@terra.money>',
    }),
  };

  static args = [{ name: 'name', required: true }];

  async run() {
    const { args, flags } = this.parse(CodeNew);

    // Command execution path.
    const execPath = flags.path;

    // Command to be performed.
    const command = async () => {
      cli.log(`Generating contract ${args.name}:`);
      cli.action.start('- contract');

      await TemplateScaffolding.from({
        remoteUrl: `https://www.github.com/CosmWasm/cw-template/archive/${flags.commitHash}.zip`,
        subFolder: `cw-template-${flags.commitHash}`,
        localOptions: {
          folderUrl: join(process.cwd(), flags.path, args.name),
        },
        replace: {
          entries: {
            'project-name': args.name,
            crate_name: args.name,
            authors: flags.authors,
            ' "now" | date: "%Y" ': `${new Date().getFullYear()}`,
          },
        },
      });
      cli.action.stop();
    };

    // Error check to be performed upon each backtrack iteration.
    const errorCheck = () => {
      if (existsSync(join(flags.path, args.name))) {
        TerrainCLI.error(`Project '${args.name}' already exists under path '${flags.path}'.\nTip: Use another path or contract name`);
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
