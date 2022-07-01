import * as R from 'ramda';
import * as fs from 'fs-extra';
import { LCDClientConfig, MnemonicKey, RawKey, SignatureV2 } from '@terra-money/terra.js';
import { cli } from 'cli-ux';
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid';
import { LedgerKey } from '@terra-money/ledger-terra-js';

type Fee = {
  gasLimit: number;
  amount: { [coin: string]: number };
};

export type InstantiateMessage = Record<string, any>;

export type ContractConfig = {
  // TODO: Remove since fee in config is deprecated.
  /**
 * @deprecated The property should not be used
 */
  store?: { fee: Fee };
  instantiation: {
  // TODO: Remove since fee in config is deprecated.
  /**
 * @deprecated The property should not be used
 */
    fee?: Fee;
    instantiateMsg: InstantiateMessage;
  };
};

type Config = {
  [contract: string]: ContractConfig;
};

type GlobalConfig = {
  _base: ContractConfig;
  [contract: string]: ContractConfig;
};

export type ContractRef = {
  codeId: number;
  contractAddresses: {
    [key: string]: string;
  };
};

export type Refs = {
  [network: string]: {
    [contract: string]: ContractRef;
  };
};

export const connection = (networks: { [network: string]: { _connection: LCDClientConfig } }) => (network: string) => networks[network]._connection
    || cli.error(`network '${network}' not found in config`);

export const loadConnections = (
  path = `${__dirname}/template/config.terrain.json`,
) => connection(fs.readJSONSync(path));

export const config = (allConfig: { _global: GlobalConfig; [network: string]: Partial<Config> }) => (network: string, contract: string): ContractConfig => {
  const globalBaseConfig = (allConfig._global && allConfig._global._base) || {};
  const globalContractConfig = (allConfig._global && allConfig._global[contract]) || {};

  const baseConfig = (allConfig[network] && allConfig[network]._base) || {};
  const contractConfig = (allConfig[network] && allConfig[network][contract]) || {};

  return [
    allConfig._global._base,
    globalBaseConfig,
    globalContractConfig,
    baseConfig,
    contractConfig,
  ].reduce(R.mergeDeepRight) as any;
};

export const saveConfig = (
  valuePath: string[],
  value: string | Record<string, any>,
  path: string,
) => {
  const conf = fs.readJSONSync(path);
  const updated = R.set(R.lensPath(valuePath), value, conf);
  fs.writeJSONSync(path, updated, { spaces: 2 });
};

export const loadConfig = (
  path = `${__dirname}/template/config.terrain.json`,
) => config(fs.readJSONSync(path));

export const loadKeys = async (
  lcd,
  path = `${__dirname}/template/keys.terrain.js`,
): Promise<{ [keyName: string]: RawKey | LedgerKey }> => {
  const keys = require(path);
  const body = R.map(
    async (w) => {
      if (w.privateKey) {
        return new RawKey(Buffer.from(w.privateKey, 'base64'));
      }

      if (w.mnemonic) {
        return new MnemonicKey(w);
      }

      if (w.ledger) {
        const transport = await TransportNodeHid.open('');
        const key = await LedgerKey.create(transport, w.ledger.index ?? '0');

        (key as any).createAndSign = async (input) => {
          const { accAddress } = key;
          const {
            account_number: accountNumber,
            sequence,
          } = await lcd.auth.accountInfo(accAddress);

          const signMode = SignatureV2.SignMode.SIGN_MODE_LEGACY_AMINO_JSON;
          const unsignedTx = await lcd.tx.create([{ address: accAddress }], { feeDenoms: ['uluna'], ...input });
          const options = { chainID: 'columbus-5', accountNumber, sequence, signMode };
          return key.signTx(unsignedTx, options, true);
        };

        return key;
      }

      return cli.error(
        'Error: Key must be defined with either `privateKey` or `mnemonic`',
      );
    },
    keys,
  );

  const keyNames = Object.keys(body);
  const resolvedBody = {};

  // eslint-disable-next-line no-restricted-syntax
  for (const name of keyNames) {
    // eslint-disable-next-line no-await-in-loop
    resolvedBody[name as any] = await body[name as any];
  }

  return resolvedBody;
};

export const setCodeId = (network: string, contract: string, codeId: number) => R.set(R.lensPath([network, contract, 'codeId']), codeId);

export const setContractAddress = (
  network: string,
  contract: string,
  instanceId: string,
  contractAddress: string,
) => R.set(
  R.lensPath([network, contract, 'contractAddresses', instanceId]),
  contractAddress,
);

export const loadRefs = (
  path = `${__dirname}/template/refs.terrain.json`,
): Refs => fs.readJSONSync(path);

export const saveRefs = (refs: Refs, path: string) => {
  fs.writeJSONSync(path, refs, { spaces: 2 });
};
