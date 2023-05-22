import { LCDClient, LocalTerra, Wallet } from '@terra-money/feather.js';
import hyperlinker from 'hyperlinker';
import { cli } from 'cli-ux';
import dedent from 'dedent';
import * as path from 'path';
import { loadKeys, loadConnections } from '../config';
import { isLocalNetwork } from '../util';
import TerrainCLI from '../TerrainCLI';

export const getSigner = async ({
  network,
  signerId,
  keysPath,
  lcd,
  prefix,
}: {
  network: string;
  signerId: string;
  keysPath: string;
  lcd: LCDClient;
  prefix: string;
}): Promise<Wallet> => {
  const localterra = new LocalTerra();
  if (
    isLocalNetwork(network)
    && Object.prototype.hasOwnProperty.call(localterra.wallets, signerId)
  ) {
    // Attempt to request sequence from LocalTerra.
    // Alert user if LocalTerra request fails.
    try {
      const signer = localterra.wallets[signerId as keyof typeof localterra.wallets];
      const connections = loadConnections(prefix);
      const { chainID } = connections(network);

      await signer.sequence(chainID);
      cli.log(
        `Using pre-baked '${signerId}' wallet on LocalTerra as signer...`,
      );
      return signer;
    } catch (error) {
      console.log('error', error);
      TerrainCLI.error(
        dedent`
        "LocalTerra" is currently not running.\n
        If you would like to use this local testing environment, make sure to install it and keep it running in the background when executing "Terrain" commands:\n
        "${hyperlinker(
    'https://github.com/terra-money/localterra',
    'https://github.com/terra-money/localterra#readme',
  )}"
        `,
        'Network Unavailable',
      );
    }
  }
  // If using testnet or mainnet, evaluate if key of provided signer
  // is available in keysPath. If so, return signer Wallet.
  const keys = loadKeys(path.join(process.cwd(), keysPath));
  if (!keys[signerId]) {
    TerrainCLI.error(
      `The key corresponding to "${signerId}" does not exist in "${keysPath}".`,
      'Signer Not Found',
    );
  }
  return new Wallet(lcd, keys[signerId]);
};
