import { Command, flags } from "@oclif/command";
import { execSync } from "child_process";
import * as path from "path";
import * as fs from "fs";

export default class Test extends Command {
  static description = "Runs unit tests for a contract directory.";

  static examples = [
    "$ terrain test",
    "$ terrain test counter",
    "$ terrain test counter --no-fail-fast",
  ];

  static flags = {
    "no-fail-fast": flags.boolean({
      description: "Run all tests regardless of failure.",
      default: false
    })
  };

  static args = [{ name: "contract-name" }];

  async run() {
    const { args, flags } = this.parse(Test);
    const contractName = args["contract-name"];
    if (contractName) {
      process.chdir(path.join("contracts", contractName));
    }

    const exists = fs.existsSync('./Cargo.toml');
    if (!exists) {
      throw Error(`Folder '${process.cwd()}' does not contain a smart contract.\nTip: Use another path or contract name`)
    }

    execSync(
      `cargo test ${flags["no-fail-fast"] ? "--no-fail-fast" : ""}`, { stdio: "inherit" }
    );
  }
}
