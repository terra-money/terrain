import { Command, flags } from "@oclif/command";
import { execSync } from "child_process";
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
    const sep = '=================================================================';
    const { args, flags } = this.parse(Test);

    // Specify default contract path from terrain project root directory.
    let contractPath = `contracts/${args["contract-name"]}`;

    // Backtrack through file tree to find contract directory.
    const fs = require('fs');
    while (!fs.existsSync(contractPath) && contractPath.slice(0, 12) !== '../../../../') {

      // If contracts directory available, but contractPath is not, 
      // then contract name referenced in terrain test command is invalid.
      if (fs.existsSync('contracts/')) {
        console.error(`\n${sep}\n\nERROR: Contract '${args["contract-name"]}' not available in contracts directory.\n\n${sep}\n`)
        process.exit()
      }

      // If contractPath does not exist in current directory, move back one directory.
      contractPath = '../' + contractPath;
    }

    // If contractPath not found after moving back 4 directories, 
    // tell user to run command in a terrain project directory.
    if (!fs.existsSync(contractPath)) {
      console.error(`\n${sep}\n\nERROR: Please ensure that you are in a terrain project directory.\n\n${sep}\n`)
      process.exit()
    }

    // If contractPath available, alert user of testing initialization, 
    // change working directory to contractPath and execute cargo test command.
    console.log(`\n${sep}\n\nTesting '${args["contract-name"]}' contract.\n\n${sep}\n`)
    process.chdir(contractPath);
    execSync(
      `cargo test ${flags["no-fail-fast"] ? "--no-fail-fast" : ""}`, { stdio: "inherit" }
    );
  }
}
