import { Command, flags } from '@oclif/command';
import * as path from 'path';
import * as repl from 'repl';
import * as terrajs from '@terra-money/terra.js';
import { getEnv } from '../lib/env';

function isClass(v) {
  return typeof v === 'function' && /^\s*class\s+/.test(v.toString());
}

export default class Console extends Command {
  static description = 'Start a repl console that provides context and convinient utilities to interact with the blockchain and your contracts.';

  static flags = {
    network: flags.string({ default: 'localterra' }),
    'config-path': flags.string({ default: 'config.terrain.json' }),
    'refs-path': flags.string({ default: 'refs.terrain.json' }),
    'keys-path': flags.string({ default: 'keys.terrain.js' }),
  };

  static args = [];

  async run() {
    const { args, flags } = this.parse(Console);
    const fromCwd = (p: string) => path.join(process.cwd(), p);

    const env = getEnv(
      fromCwd(flags['config-path']),
      fromCwd(flags['keys-path']),
      fromCwd(flags['refs-path']),
      flags.network,
    );

    let Lib = require(path.join(process.cwd(), 'lib'));

    let libInstance;
    if (Lib.default) {
      Lib = Lib.default;
    }

    if (isClass(Lib)) {
      libInstance = new Lib(env);
    } else {
      libInstance = Lib(env);
    }
 
    // for repl server
    const {
      config, refs, wallets, client,
    } = env;

    const r = repl.start({ prompt: 'terrain > ', useColors: true });

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
  }
}
