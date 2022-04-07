import { Command, flags } from "@oclif/command";
import { execSync } from "child_process";
import * as fs from "fs-extra";
import cli from "cli-ux";
import * as path from "path";
export default class New extends Command {
  static description = "Create new dapp from a frontend template.";

  static examples = [
    "$ terrain new awesome-dapp",
    "$ terrain new awesome-dapp --path path/to/dapp",
  ];

  static flags = {
    path: flags.string({ description: "path to keep the project" }),
    framework: flags.string({
      description: "frontend framework template you want to use",
      options: ["next", "vue", "vite", "lit", "svelte", "create-react-app"],
      default: "create-react-app",
    }),
    version: flags.string({
      default: "0.16",
    }),
  };

  static args = [{ name: "name", required: true }];

  async run() {
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
    execSync(
      `npx copy-github-directory https://github.com/terra-money/wallet-provider/tree/main/templates/${flags.framework} frontend`
    )

    cli.action.stop();
    fs.copySync(path.join(__dirname, "..", "template"), process.cwd());
  }
}
