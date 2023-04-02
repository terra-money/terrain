import { Command } from '@oclif/command';
import path from 'path';
import runCommand from '../../lib/runCommand';
import defaultErrorCheck from '../../lib/defaultErrorCheck';
import tesseractCLI from '../../tesseractCLI';

export default class ContractSchema extends Command {
  static description = 'Generate contract schema.';

  static args = [{ name: 'contract', required: true }];

  async run() {
    const { args } = this.parse(ContractSchema);

    // Command execution path.
    const execPath = path.join('contracts', args.contract);

    // Command to be performed.
    const command = async () => {
      process.chdir(execPath);
      tesseractCLI.runCargoCommand('schema');
    };

    // Attempt to execute command while backtracking through file tree.
    await runCommand(
      execPath,
      command,
      defaultErrorCheck(args.contract),
    );
  }
}
