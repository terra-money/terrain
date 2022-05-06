import { Command, flags } from '@oclif/command';
import { TemplateScaffolding } from '@terra-money/template-scaffolding';
import cli from 'cli-ux';
import * as path from 'path';

export default class New extends Command {
  static description = "Create new dapp from a template.";

  static examples = [
    '$ terrain new awesome-dapp',
    '$ terrain new awesome-dapp --path path/to/dapp',
    '$ terrain new awesome-dapp --path path/to/dapp --authors ExampleAuthor<example@email.domain>',
  ];

  static flags = {
    path: flags.string({
      description: 'Path to create the workspace',
      default: '.'
    }),
    version: flags.string({
      default: "0.16",
    }),
    authors: flags.string({
      default: 'Terra Money <core@terra.money>',
    }),
  };

  static args = [{ name: "name", required: true }];

  async run() {
    const { args, flags } = this.parse(New);

    cli.log(`generating ${args.name}:`);

    cli.action.start('- workspace');
    await TemplateScaffolding.from({
      remoteUrl: `https://codeload.github.com/terra-money/terrain-core-template/zip/refs/heads/main`,
      localOptions: {
        folderUrl: path.join(process.cwd(), flags.path, args.name),
        toRootFolderUrl: true
      },
      replace: {
        entries: {
          "project-name": args.name,
          "authors": flags.authors
        }
      }
    });
    cli.action.stop();
    process.chdir("..");

    cli.action.start("- frontend");
    if (flags.framework === "react") {
      await new Promise((resolve, reject) => {
        const file = fs.createWriteStream("frontend.zip");
        request
          .get(
            "https://github.com/terra-money/terrain-frontend-template/archive/refs/heads/main.zip"
          )
          .on("error", (error) => {
            reject(error);
          })
          .pipe(file)
          .on("finish", () => {
            cli.action.stop();
            resolve(null);
          });
      });
      const zip = new Zip("frontend.zip");
      zip.extractAllTo(".", true);
      fs.renameSync("terrain-frontend-template-main", "frontend");
      fs.removeSync("frontend.zip");
    } else {
      execSync(
        `npx copy-github-directory https://github.com/terra-money/wallet-provider/tree/main/templates/${flags.framework} frontend`,
      );
      process.chdir("frontend");
      fs.removeSync("sandbox.config.json");
    }

    cli.action.start('- contract');
    await TemplateScaffolding.from({
      remoteUrl: `https://codeload.github.com/InterWasm/cw-template/zip/refs/heads/${flags.version}`,
      localOptions: {
        folderUrl: path.join(process.cwd(), flags.path, args.name, "contracts", args.name),
        toRootFolderUrl: true
      },
      replace: {
        entries: {
          "project-name" : args.name,
          "crate_name" : args.name,
          "authors" : flags.authors,
          " \"now\" | date: \"%Y\" ": `${new Date().getFullYear()}`
        }
      }
    });
    cli.action.stop();

    cli.action.start('- frontend');

    await TemplateScaffolding.from({
      remoteUrl: `https://codeload.github.com/terra-money/terrain-frontend-template/zip/refs/heads/main`,
      localOptions: {
        folderUrl: path.join(process.cwd(), flags.path, args.name, "frontend"),
        toRootFolderUrl: true
      },
      replace: {
        entries: {
          "project-name" : args.name,
          "authors" : flags.authors
        }
      }
    });
    cli.action.stop();
  }
}
