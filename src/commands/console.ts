import { Command } from '@oclif/command';
import { join } from 'path';
import { existsSync } from 'fs';
import { start } from 'repl';
import * as terrajs from '@terra-money/terra.js';
import { getEnv } from '../lib/env';
import { signer, network, terrainPaths } from '../lib/flag';
import TerrainCLI from '../TerrainCLI';
import runCommand from '../lib/runCommand';

// Needed for Terrain to be able to require typescript modules.
require('ts-node').register({
  // Don't actually check types of libs.
  transpileOnly: true,
  // Make sure we don't double transpile source code.
  ignore: ['(?:^|/)node_modules/', 'src/commands/.*\\.ts', 'src/lib/.*\\.ts'],
});

export default class Console extends Command {
  static description = 'Start a repl console that provides context and convenient utilities to interact with the blockchain and your contracts.';

  static flags = {
    signer,
    network,
    ...terrainPaths,
  };

  static args = [];

  async run() {
    const { flags } = this.parse(Console);

    // Command execution path.
    const execPath = 'lib';

    // Command to be performed.
    const command = async () => {
      const env = getEnv(
        join(process.cwd(), flags['config-path']),
        join(process.cwd(), flags['keys-path']),
        join(process.cwd(), flags['refs-path']),
        flags.network,
        flags.signer,
      );

      // eslint-disable-next-line import/no-dynamic-require, global-require
      let Lib = await import(join(process.cwd(), 'lib'));

      let libInstance;

      // Detect if a default export exists and use that.
      if (Lib?.default) {
        Lib = Lib.default;
      }

      // Need the new keyword if Lib is a class.
      if (typeof Lib === 'function' && Lib.prototype?.constructor) {
        libInstance = new Lib(env);
      } else {
        libInstance = Lib(env);
      }

      // for repl server
      const {
        config, refs, wallets, client,
      } = env;

      const r = start({ prompt: 'terrain > ', useColors: true });

      const def = (name: string, value: any) => Object.defineProperty(r.context, name, {
        configurable: false,
        enumerable: true,
        value,
      });

      def('config', config);
      def('refs', refs);
      def('wallets', wallets);
      def('client', client);
      def('terrajs', terrajs);
      def('lib', libInstance);
    };

    // Error check to be performed upon each backtrack iteration.
    const errorCheck = () => {
      if (existsSync('contracts') && !existsSync(execPath)) {
        TerrainCLI.error(
          `Execution directory '${execPath}' not available.`,
        );
      }
    };

    // Attempt to execute command while backtracking through file tree.
    await runCommand(
      execPath,
      command,
      errorCheck,
    );
  }
}
