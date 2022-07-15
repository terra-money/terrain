import * as R from 'ramda';
import * as fs from 'fs-extra';
import { LCDClientConfig, MnemonicKey, RawKey } from '@terra-money/terra.js';
import { cli } from 'cli-ux';

type Fee = {
  gasLimit: number;
  amount: { [coin: string]: number };
};

export type InstantiateMessage = Record<string, any>;

export type ContractConfig = {
  /**
   * @deprecated The property should not be used
   */
  store?: { fee: Fee };
  instantiation: {
    /**
     * @deprecated The property should not be used
     */
    fee?: Fee;
    instantiateMsg: InstantiateMessage;
  };
  deployTask?: string,
};

type Config = {
  _base: ContractConfig;
  contracts?: { [contract: string]: ContractConfig };
};

type GlobalConfig = {
  _base: ContractConfig;
  useCargoWorkspace?: boolean;
  contracts?: { [contract: string]: ContractConfig };
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

export const connection = (
  networks: {
    [network: string]: {
      _connection: LCDClientConfig,
    }
  },
) => (network: string) => networks[network]._connection
    || cli.error(`network '${network}' not found in config`);

export const loadConnections = (
  path = `${__dirname}/template/config.terrain.json`,
) => connection(fs.readJSONSync(path));

export const config = (
  allConfig: {
    _global: GlobalConfig;
    [network: string]: Partial<Config>;
  },
) => (network: string, contract: string): ContractConfig => {
  const globalBaseConfig = (allConfig._global && allConfig._global._base) || {};
  const globalContractConfig = (
    allConfig._global
    && allConfig._global.contracts
    && allConfig._global.contracts[contract]
  ) || {};

  const baseConfig = (allConfig[network] && allConfig[network]._base) || {};
  const contractConfig = (
    allConfig[network]
    && allConfig[network].contracts
    && allConfig[network].contracts![contract]
  ) || {};

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

export const loadGlobalConfig = (
  path = `${__dirname}/template/config.terrain.json`,
  // Extract useCargoWorkspace from global config.
) => (({ _global: { useCargoWorkspace } }) => ({ useCargoWorkspace }))(fs.readJSONSync(path));

export const loadKeys = (
  path = `${__dirname}/template/keys.terrain.js`,
): { [keyName: string]: RawKey } => {
  // eslint-disable-next-line import/no-dynamic-require, global-require
  const keys = require(path);
  return R.map(
    (w) => {
      if (w.privateKey) {
        return new RawKey(Buffer.from(w.privateKey, 'base64'));
      }

      if (w.mnemonic) {
        return new MnemonicKey(w);
      }

      return cli.error(
        'Error: Key must be defined with either `privateKey` or `mnemonic`',
      );
    },
    keys,
  );
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
