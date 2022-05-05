import { Command, flags } from "@oclif/command";
import { execSync } from "child_process";
import { existsSync } from 'fs';
import TerrainCLI from '../TerrainCLI';

export default class Test extends Command {
  static description = "Runs unit tests for a contract directory.";

  static examples = [
    "$ terrain test counter",
    "$ terrain test counter --no-fail-fast",
  ];

  static flags = {
    "no-fail-fast": flags.boolean({ description: "Run all tests regardless of failure." })
  };

  static args = [{ name: "contract-name", required: true }];

  async run() {
    const { args, flags } = this.parse(Test);

    // Specify default contract path from terrain project root directory.
    let contractPath = `contracts/${args["contract-name"]}`;

    // Backtrack through file tree to find contract directory.
    for (let stepBack = 1; stepBack <= 4; stepBack++) {

      // If contractPath available, alert user of testing initialization, 
      // change working directory to contractPath and execute cargo test command.
      if (existsSync(contractPath)) {
        TerrainCLI.log(`Testing '${args["contract-name"]}' contract.`);
        process.chdir(contractPath);
        execSync(
          `cargo test ${flags["no-fail-fast"] ? "--no-fail-fast" : ""}`, { stdio: "inherit" }
        );
        process.exit();
      }
  
      // If contracts directory exists, but contractPath does not, 
      // then contract referenced in terrain test command does not exist.
      if (existsSync('contracts/') && !existsSync(contractPath)) {
        TerrainCLI.error(
          `Contract '${args["contract-name"]}' not available in contracts directory.`
        );
        process.exit();
      }

      // If contracts directory does not exist in current directory, step back one directory.
      contractPath = '../' + contractPath;
    }

    // If contractPath not found after stepping back 4 directories, 
    // tell user to run command in a terrain project directory.
    TerrainCLI.error(
      `Please ensure that you are in a terrain project directory.`
    );
    process.exit();
  }
}
