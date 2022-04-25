import { Command, flags } from "@oclif/command";
import { execSync } from "child_process";
import * as fs from "fs-extra";
import cli from "cli-ux";
import * as request from "superagent";
import * as Zip from "adm-zip";
import * as path from "path";

export default class New extends Command {
  static description = "Create new dapp from a template.";

  static examples = [
    "$ terrain new awesome-dapp",
    "$ terrain new --framework vue awesome-dapp",
    "$ terrain new awesome-dapp --path path/to/dapp",
    "$ terrain new --framework next awesome-dapp --path path/to/dapp",
  ];

  static flags = {
    path: flags.string({ description: "path to keep the project" }),
    framework: flags.string({
      description: "Choose the frontend framework you want to use. Non-react framework options have better wallet-provider support but less streamlined contract integration.",
      options: ["next", "vue", "vite", "lit", "svelte", "react"],
      default: "react",
    }),
    version: flags.string({
      default: "0.16",
    }),
  };

  static args = [{ name: "name", required: true }];

  async run() {
    cli.log("CORRECT TESTING ONE: ");
    const { args, flags } = this.parse(New);

    cli.log("generating: ");
    cli.action.start("- contract");

    if (flags.path) {
      process.chdir(flags.path);
    }

    fs.mkdirSync(args.name);
    process.chdir(args.name);

    fs.mkdirSync("contracts");
    process.chdir("contracts");

    execSync(
      `cargo generate --git https://github.com/CosmWasm/cw-template.git --branch ${flags.version} --name counter`
    );

    cli.action.stop();
    process.chdir("..");

    cli.action.start("- frontend");
    if (flags.framework === 'react') {
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
      const zip = new Zip('frontend.zip');
      zip.extractAllTo('.', true);
      fs.renameSync('terrain-frontend-template-feat-typescript-conversion', 'frontend');
      fs.removeSync('frontend.zip');
    } else {
      execSync(
        `npx copy-github-directory https://github.com/terra-money/wallet-provider/tree/main/templates/${flags.framework} frontend`
      );
      process.chdir("frontend");
      fs.removeSync("sandbox.config.json");
    }

    cli.action.stop();
    fs.copySync(path.join(__dirname, "..", "template"), process.cwd());
  }
}
