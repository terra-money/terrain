import { Command, flags } from '@oclif/command';
import { execSync } from 'child_process';
import { join } from 'path';
import runCommand from '../lib/runCommand';
import defaultErrorCheck from '../lib/defaultErrorCheck';

/**
 * Runs unit tests for a contract directory.
 * Examples:
 * $ tesseract test counter
 * $ tesseract test counter --no-fail-fast
 */
export default class Test extends Command {
  // Specify description to be displayed upon help command execution.
  static description = 'Runs unit tests for a contract directory.';

  // Specify examples included upon help test command execution.
  static examples = [
    '$ tesseract test counter',
    '$ tesseract test counter --no-fail-fast',
  ];

  // Initialize args to be given after test command.
  static args = [{ name: 'contract-name', required: true }];

  // Initialize flags, prefixed with '--' in a terminal command, to be given after args.
  static flags = {
    'no-fail-fast': flags.boolean({ description: 'Run all tests regardless of failure.' }),
  };

  async run() {
    // Extract args and flags specified in executed test command.
    const { args, flags } = this.parse(Test);

    // Command execution path.
    const execPath = join('contracts', args['contract-name']);

    // Command to be performed.
    const command = () => {
      process.chdir(execPath);
      execSync(
        `cargo test ${flags['no-fail-fast'] ? '--no-fail-fast' : ''}`,
        { stdio: 'inherit' },
      );
    };

    // Attempt to execute command while backtracking through file tree.
    await runCommand(
      execPath,
      command,
      defaultErrorCheck(args['contract-name']),
    );
  }
}
