import * as R from 'ramda';
import * as fs from 'fs-extra';
import { LCDClientConfig, MnemonicKey, RawKey } from '@terra-money/feather.js';
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
  [contractName: string]: {
    codeId: number;
    contractAddresses: {
      [key: string]: string;
    };
  }
};

export type Refs = {
  [network: string]: {
    [chainID: string]: ContractRef;
  };
};

export type Network = {
  [network: string]: {
    [chainID: string] : LCDClientConfig
  }
}

export const DEFAULT_CONFIG_PATH = `${__dirname}/template/config.terrain.json`;
export const DEFAULT_REFS_PATH = `${__dirname}/template/refs.terrain.json`;

export const connection = (
  networks: Network,
  prefix: string,
) => (network: string) => {
  const chainID = Object.keys(networks[network])
    .find((chainID) => networks[network][chainID].prefix === prefix);
  if (!chainID) cli.error(`no chain with network '${network}' with prefix '${prefix}' not found in config`);
  return networks[network][chainID];
};

export const loadConnections = (
  path: string,
  prefix: string,
) => connection(fs.readJSONSync(path), prefix);

export const getFeeDenom = (network: string, prefix: string, path: string) => {
  const connections = loadConnections(path, prefix);
  return Object.keys(connections(network).gasPrices)[0];
};

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
  path = DEFAULT_CONFIG_PATH,
) => config(fs.readJSONSync(path));

export const loadGlobalConfig = (
  path = DEFAULT_CONFIG_PATH,
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

export const setCodeId = (network: string, chainID: string, contract: string, codeId: number) => R.set(R.lensPath([network, chainID, contract, 'codeId']), codeId);
export const setContractAddress = (
  network: string,
  chainID: string,
  contract: string,
  instanceId: string,
  contractAddress: string,
) => {
  console.log('is called!');
  return R.set(
    R.lensPath([network, chainID, contract, 'contractAddresses', instanceId]),
    contractAddress,
  );
};

export const loadRefs = (
  path: string,
): Refs => fs.readJSONSync(path);

export const saveRefs = (refs: Refs, path: string) => {
  fs.writeJSONSync(path, refs, { spaces: 2 });
};
