import { cli } from 'cli-ux';

class TerrainCLI {
  error(body = '') {
    cli.log(
      `\n\x1b[33m${'>'}\x1b[0m \x1b[31mError: ${body}\x1b[0m\n`,
    );
  }
  log(body = '') {
    cli.log(
      `\n\x1b[33m${'>'}\x1b[0m \x1b[32m${body}\x1b[0m\n`,
    );
  }
}

export default new TerrainCLI();
