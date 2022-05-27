import chalk, { ChalkInstance } from 'chalk';
import cli from 'cli-ux';

/** TerrainCLI offers default log styling for terrain commands. */
class TerrainCLI {
  prefix: string;

  logStyle: ChalkInstance;

  successStyle: ChalkInstance;

  warningStyle: ChalkInstance;

  errorStyle: ChalkInstance;

  anykeyStyle: ChalkInstance;

  constructor(
    prefix: string,
    logStyle: ChalkInstance,
    successStyle: ChalkInstance,
    warningStyle: ChalkInstance,
    errorStyle: ChalkInstance,
    anykeyStyle: ChalkInstance,
  ) {
    this.prefix = prefix;
    this.logStyle = logStyle;
    this.successStyle = successStyle;
    this.warningStyle = warningStyle;
    this.errorStyle = errorStyle;
    this.anykeyStyle = anykeyStyle;
  }

  // TerrainCLI.log() styling.
  log(logMsg = '') {
    cli.log(
      `\n${this.prefix} ${this.logStyle(logMsg)}\n`,
    );
  }

  // TerrainCLI.success() styling.
  success(successMsg = '') {
    cli.log(
      `\n${this.prefix} ${this.successStyle(successMsg)}\n`,
    );
  }

  // TerrainCLI.warning() styling.
  warning(warningMsg = '') {
    cli.log(
      `\n${this.prefix} ${this.warningStyle(`Warning: ${warningMsg}`)}\n`,
    );
  }

  // TerrainCLI.error() styling.
  error(errorMsg = '') {
    cli.log(
      `\n${this.prefix} ${this.errorStyle(`Error: ${errorMsg}`)}\n`,
    );
  }

  // await TerrainCLI.anykey() styling.
  async anykey(anykeyMsg = '') {
    await cli.anykey(`\n${this.prefix} ${this.anykeyStyle(`${anykeyMsg}`)}`);
  }
}

export default new TerrainCLI(chalk.yellow('>'), chalk.white, chalk.green, chalk.hex('#FFA500'), chalk.red, chalk.cyan);
