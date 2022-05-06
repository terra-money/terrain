import { cli } from 'cli-ux';

/** TerrainCLI offers default log styling for terrain commands. */
class TerrainCLI {
  prefixColor: string;

  logColor: string;

  errorColor: string;

  warningColor: string;

  reset: string;

  constructor(
    prefixColor: string,
    logColor: string,
    errorColor: string,
    warningColor:string,
    reset: string,
  ) {
    this.prefixColor = prefixColor;
    this.logColor = logColor;
    this.errorColor = errorColor;
    this.warningColor = warningColor;
    this.reset = reset;
  }

  // TerrainCLI.log() styling.
  log(body = '') {
    cli.log(
      `\n${this.prefixColor}>${this.reset} ${this.logColor}${body}${this.reset}\n`,
    );
  }

  // TerrainCLI.error() styling.
  error(body = '') {
    cli.log(
      `\n${this.prefixColor}>${this.reset} ${this.errorColor}Error: ${body}${this.reset}\n`,
    );
  }

  // TerrainCLI.warning() styling.
  warning(body = '') {
    cli.log(
      `\n${this.prefixColor}>${this.reset} ${this.warningColor}Warning: ${body}${this.reset}\n`,
    );
  }
}

export default new TerrainCLI('\x1b[37m', '\x1b[32m', '\x1b[31m', '\x1b[33m', '\x1b[0m');
