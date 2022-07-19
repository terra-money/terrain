import chalk, { Chalk } from 'chalk';
import cli from 'cli-ux';
import boxen from 'boxen';

/** TerrainCLI offers default log styling for terrain commands. */
class TerrainCLI {
  prefix: string;

  logStyle: Chalk;

  successStyle: Chalk;

  warningStyle: Chalk;

  alertStyle: Chalk;

  errorStyle: Chalk;

  anykeyStyle: Chalk;

  constructor(
    prefix: string,
    logStyle: Chalk,
    successStyle: Chalk,
    warningStyle: Chalk,
    alertStyle: Chalk,
    errorStyle: Chalk,
    anykeyStyle: Chalk,
  ) {
    this.prefix = prefix;
    this.logStyle = logStyle;
    this.successStyle = successStyle;
    this.warningStyle = warningStyle;
    this.alertStyle = alertStyle;
    this.errorStyle = errorStyle;
    this.anykeyStyle = anykeyStyle;
  }

  // TerrainCLI.log(logMsg) styling.
  log(logMsg = '') {
    cli.log(
      `\n${this.prefix} ${this.logStyle(logMsg)}\n`,
    );
  }

  // TerrainCLI.success(successMsg) styling.
  success(successMsg = '') {
    cli.log(
      `\n${this.prefix} ${this.successStyle(successMsg)}\n`,
    );
  }

  // TerrainCLI.warning(warningMsg) styling.
  warning(warningMsg = '') {
    cli.log(
      `\n${this.prefix} ${this.warningStyle(`Warning: ${warningMsg}`)}\n`,
    );
  }

  // TerrainCLI.alert(alertMsg, title, maxWidth) styling
  alert(alertMsg = '', title = 'Hey! 👋', maxWidth = 36) {
    cli.log(
      this.alertStyle(
        boxen(
          alertMsg.replace(new RegExp(`(?![^\\n]{1,${maxWidth}}$)([^\\n]{1,${maxWidth}})\\s`, 'g'), '$1\n'),
          {
            title, titleAlignment: 'center', padding: 1, margin: 1,
          },
        ),
      ),
    );
  }

  // TerrainCLI.error(errorMsg) styling.
  error(errorMsg = '') {
    cli.log(
      `\n${this.prefix} ${this.errorStyle(`Error: ${errorMsg}`)}\n`,
    );
  }

  // await TerrainCLI.anykey(anykeyMsg) styling.
  async anykey(anykeyMsg = '') {
    await cli.anykey(`\n${this.prefix} ${this.anykeyStyle(`${anykeyMsg}`)}`);
  }
}

export default new TerrainCLI(chalk.yellow('>'), chalk.white, chalk.green, chalk.hex('#FFA500'), chalk.hex('#CB48E8'), chalk.red, chalk.cyan);
