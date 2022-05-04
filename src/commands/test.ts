import { Command, flags } from "@oclif/command";
import { execSync } from "child_process";
import { range } from "ramda";
import { existsSync } from 'fs';

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
    const sep = '\n=================================================================\n';
    const { args, flags } = this.parse(Test);

    // Specify default contract path from terrain project root directory.
    let contractPath = `contracts/${args["contract-name"]}`;

    // Backtrack through file tree to find contract directory.
    for (let step_back = 1; step_back <=4; step_back++) {

      // If contractPath available, alert user of testing initialization, 
      // change working directory to contractPath and execute cargo test command.
      if (existsSync(contractPath)) {
        console.log(`${sep}\nTesting '${args["contract-name"]}' contract.\n${sep}`);
        process.chdir(contractPath);
        execSync(
          `cargo test ${flags["no-fail-fast"] ? "--no-fail-fast" : ""}`, { stdio: "inherit" }
        );
        process.exit();
      }
  
      // If contracts directory available, but contractPath is not, 
      // then contract name referenced in terrain test command is invalid.
      if (existsSync('contracts/') && !existsSync(contractPath)) {
        console.error(
          `${sep}\nERROR: Contract '${args["contract-name"]}' not available in contracts directory.\n${sep}`
        );
        process.exit();
      }

      // If contracts directory does not exist in current directory, step back one directory.
      contractPath = '../' + contractPath;
    }

    // If contractPath not found after stepping back 4 directories, 
    // tell user to run command in a terrain project directory.
    console.error(
      `${sep}\nERROR: Please ensure that you are in a terrain project directory.\n${sep}`
    );
    process.exit();
  }
}
