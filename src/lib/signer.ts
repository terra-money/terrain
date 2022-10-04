import { LCDClient, LocalTerra, Wallet } from '@terra-money/terra.js';
import { cli } from 'cli-ux';
import * as path from 'path';
import { loadKeys } from '../config';
import TerrainCLI from '../TerrainCLI';

export const getSigner = async ({
  network,
  signerId,
  keysPath,
  lcd,
}: {
  network: string;
  signerId: string;
  keysPath: string;
  lcd: LCDClient;
}): Promise<Wallet> => {
  // If transaction is being attempted on LocalTerra...
  const localterra = new LocalTerra();
  if (
    network === 'localterra'
    && Object.prototype.hasOwnProperty.call(localterra.wallets, signerId)
  ) {
    // Attempt to request sequence from LocalTerra.
    // Alert user if LocalTerra request fails.
    try {
      const signer = localterra.wallets[signerId as keyof typeof localterra.wallets];
      await signer.sequence();
      cli.log(`Using pre-baked '${signerId}' wallet on LocalTerra as signer...`);
      return signer;
    } catch {
      TerrainCLI.error(
        'LocalTerra is currently not running.',
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
