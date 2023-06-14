import * as R from 'ramda';
import * as fs from 'fs-extra';
import { LCDClientConfig, MnemonicKey, RawKey } from '@terra-money/feather.js';
import { cli } from 'cli-ux';
import path from 'path';
import TerrainCLI from './TerrainCLI';

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
  base: ContractConfig;
  contracts?: { [contract: string]: ContractConfig };
};

type GlobalConfig = {
  base: ContractConfig;
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

export const CONFIG_FILE_NAME = 'config.terrain.json';

export const GLOBAL_CONFIG = {
  global: {
    useCargoWorkspace: false,
    prefix: 'terra',
    network: 'localterra',
    base: {
      instantiation: {
        instantiateMsg: {
          count: 0,
        },
      },
    },
  },
};

export const connection = (
  networks: Network,
  prefix: string,
) => (network: string) => {
  const chainID = Object.keys(networks[network])
    .find((chainID) => networks[network][chainID].prefix === prefix);
  if (!chainID) {
    TerrainCLI.error(`no chain with network "${network}" with prefix "${prefix}" not found in config`);
    process.exit();
  }
  return networks[network][chainID];
};

export const config = (
  allConfig: {
    global: GlobalConfig;
    [network: string]: Partial<Config>;
  },
) => (network: string, contract: string): ContractConfig => {
  const globalBaseConfig = (allConfig.global && allConfig.global.base) || {};
  const globalContractConfig = (
    allConfig.global
    && allConfig.global.contracts
    && allConfig.global.contracts[contract]
  ) || {};

  const baseConfig = (allConfig[network] && allConfig[network].base) || {};
  const contractConfig = (
    allConfig[network]
    && allConfig[network].contracts
    && allConfig[network].contracts![contract]
  ) || {};

  return [
    allConfig.global.base,
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

export const readConfig = () => {
  let currentPath = process.cwd();

  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < 5; i += 1) {
    const configPath = path.join(currentPath, CONFIG_FILE_NAME);

    try {
      const config = fs.readJSONSync(configPath);
      return config;
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        return cli.error(
          `Error reading configuration from ${configPath}: ${error.message}`,
        );
      }
    }
    currentPath = path.resolve(currentPath, '..');
  }
  return GLOBAL_CONFIG;
};

export const loadConnections = (
  prefix: string,
) => connection(readConfig(), prefix);

export const loadConfig = () => config(readConfig());

export const loadGlobalConfig = () => (({
  global: {
    useCargoWorkspace,
    prefix, network,
  },
}) => ({ useCargoWorkspace, prefix, network }))(readConfig());

export const loadKeys = (
  path: string,
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

export const loadRefs = (path: string): Refs => fs.readJSONSync(path);

export const saveRefs = (refs: Refs, path: string) => {
  fs.writeJSONSync(path, refs, { spaces: 2 });
};
