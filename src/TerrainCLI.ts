import chalk, { Chalk } from 'chalk';
import cli from 'cli-ux';
import boxen from 'boxen';
import semver from 'semver';
import dedent from 'dedent';
import { spawn } from 'child_process';
import terminalOverwrite from 'terminal-overwrite';
import { chunksToLinesAsync, chomp } from '@rauschma/stringio';

/** TerrainCLI offers default log styling for terrain commands. */
class TerrainCLI {
  prefix: string;

  anykeyStyle: Chalk;

  successStyle: Chalk;

  alertStyle: Chalk;

  errorStyle: Chalk;

  variableStyle: Chalk;

  constructor(
    prefix: string,
    anykeyStyle: Chalk,
    successStyle: Chalk,
    alertStyle: Chalk,
    errorStyle: Chalk,
    variableStyle: Chalk,
  ) {
    this.prefix = prefix;
    this.anykeyStyle = anykeyStyle;
    this.successStyle = successStyle;
    this.alertStyle = alertStyle;
    this.errorStyle = errorStyle;
    this.variableStyle = variableStyle;
  }

  // Message box styling.
  messageBox(
    msg: string,
    msgStyle: Chalk,
    title: string,
    emoji: string,
    msgBoxWidth = 46,
    variableStyle = this.variableStyle,
  ) {
    // Regex replace for text wrapping.
    const textWrapMsg = msg.replace(
      new RegExp(`(?![^\\n]{1,${msgBoxWidth}}$)([^\\n]{1,${msgBoxWidth}})\\s`, 'g'),
      '$1\n',
    );

    // Replace variables, surrounded by double quotes, by the stylized variable.
    const variableRegex = /"(.+?)"/g;
    const varHighlightMsg = textWrapMsg.replace(
      variableRegex,
      variableStyle('$1'),
    );

    // Return stylized string inside of 'boxen' object for display in terminal.
    return msgStyle(boxen(
      varHighlightMsg,
      {
        title: chalk`{bold ${emoji} ${title}}`,
        titleAlignment: 'left',
        padding: 1,
        margin: 1,
      },
    ));
  }

  // await TerrainCLI.anykey(anykeyMsg) styling.
  async anykey(anykeyMsg = '') {
    await cli.anykey(`\n${this.prefix} ${this.anykeyStyle(`${anykeyMsg}`)}`);
  }

  // TerrainCLI.success(successMsg) styling.
  success(successMsg = '', title = '', emoji = '✨') {
    cli.log(this.messageBox(successMsg, this.successStyle, title, emoji));
  }

  // TerrainCLI.error(errorMsg) styling.
  error(errorMsg = '', title = '', emoji = '🚨') {
    cli.log(this.messageBox(errorMsg, this.errorStyle, title, emoji, 46, chalk.green));
    process.exit();
  }

  // TerrainCLI.alert(alertMsg, title, maxWidth) styling
  alert(alertMsg = '', title = '', emoji = '👋') {
    cli.log(this.messageBox(alertMsg, this.alertStyle, title, emoji));
  }

  // TerrainCLI.nodeVersionCheck() styling.
  nodeVersionCheck() {
    if (!semver.satisfies(process.version, '^16')) {
      this.error(
        dedent`
          Terrain requires "Node version 16"!\n
          Please switch your version of Node before running Terrain commands.\n
          If you are utilizing nvm, simply utilize the following command:\n
          "nvm use 16"
        `,
        'Incompatible Node Version',
      );
      process.exit();
    }
  }

  // Parse cargo command output to only display progress bar.
  // eslint-disable-next-line class-methods-use-this
  async parseAndDisplayProgressBar(readable: AsyncIterable<string>) {
    // eslint-disable-next-line no-restricted-syntax
    for await (const line of chunksToLinesAsync(readable)) {
      const chompedLine = chomp(line).split('\r');
      // eslint-disable-next-line no-restricted-syntax
      for (const splitLine of chompedLine) {
        if (splitLine.includes('Building')) {
          terminalOverwrite(splitLine);
        }
      }
    }
  }

  // Run supplied cargo command with custom output.
  async runCargoCommand(command: string) {
    // stdio params: ['stdin', 'stdout', 'stderr'].
    const source = spawn(
      'cargo',
      [command, '--color', 'always'],
      {
        env: {
          ...process.env,
          CARGO_TERM_PROGRESS_WHEN: 'always',
          CARGO_TERM_PROGRESS_WIDTH: process.stdout.columns?.toString(),
        },
        stdio: ['ignore', 'ignore', 'pipe'],
      },
    );

    // Only print progress bar and exclude all verbose output from Cargo.
    await this.parseAndDisplayProgressBar(source.stderr);
  }
}

export default new TerrainCLI(
  '👉',
  chalk.cyan,
  chalk.green,
  chalk.blue,
  chalk.yellow,
  chalk.yellow,
);
