import * as R from "ramda";
import * as fs from "fs-extra";
import { LCDClientConfig, MnemonicKey, RawKey } from "@terra-money/terra.js";
import { cli } from "cli-ux";

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

export type TerrainOptions = {
  ref_base_path?: string;
  copy_refs_to?: string[];
};

type Config = {
  [contract: string]: ContractConfig;
};

type GlobalConfig = Config & {
  _base: ContractConfig;
};

export type TerrainConfig = {
  contracts: { _global: GlobalConfig; [network: string]: Partial<Config> };
  config: TerrainOptions;
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

export const connection =
  (networks: { [network: string]: { _connection: LCDClientConfig } }) =>
  (network: string) =>
    networks[network]._connection ||
    cli.error(`network '${network}' not found in config`);

export const loadConnections = (
  path = `${__dirname}/template/config.terrain.json`
) => connection(fs.readJSONSync(path).contracts);

export const contractConfig =
  (allConfig: { _global: GlobalConfig; [network: string]: Partial<Config> }) =>
  (network: string, contract: string): ContractConfig => {
    const globalBaseConfig =
      (allConfig._global && allConfig._global._base) || {};
    const globalContractConfig =
      (allConfig._global && allConfig._global[contract]) || {};

    const baseConfig = (allConfig[network] && allConfig[network]._base) || {};
    const contractConfig =
      (allConfig[network] && allConfig[network][contract]) || {};

    return [
      allConfig._global._base,
      globalBaseConfig,
      globalContractConfig,
      baseConfig,
      contractConfig,
    ].reduce(R.mergeDeepRight) as any;
  };

// TODO: This isn't used anywhere, hasn't been updated for the new config format.
export const saveConfig = (
  valuePath: string[],
  value: string | Record<string, any>,
  path: string
) => {
  const conf = fs.readJSONSync(path);
  const updated = R.set(R.lensPath(valuePath), value, conf);
  fs.writeJSONSync(path, updated, { spaces: 2 });
};

export const loadContractConfig = (
  path = `${__dirname}/template/config.terrain.json`
) => contractConfig(fs.readJSONSync(path).contracts);

export const loadTerrainConfig = (
  path = `${__dirname}/template/config.terrain.json`
) => fs.readJSONSync(path).config as TerrainOptions;

export const loadKeys = (
  path = `${__dirname}/template/keys.terrain.js`
): { [keyName: string]: RawKey } => {
  const keys = require(path);
  return R.map(
    (w) =>
      w.privateKey
        ? new RawKey(Buffer.from(w.privateKey, "base64"))
        : w.mnemonic
        ? new MnemonicKey(w)
        : cli.error(
            "Error: Key must be defined with either `privateKey` or `mnemonic`"
          ),
    keys
  );
};

export const setCodeId = (network: string, contract: string, codeId: number) =>
  R.set(R.lensPath([network, contract, "codeId"]), codeId);

export const setContractAddress = (
  network: string,
  contract: string,
  instanceId: string,
  contractAddress: string
) =>
  R.set(
    R.lensPath([network, contract, "contractAddresses", instanceId]),
    contractAddress
  );

export const loadRefs = (
  path = `${__dirname}/template/refs.terrain.json`
): Refs => fs.readJSONSync(path);

export const saveRefs = (refs: Refs, path: string) => {
  fs.writeJSONSync(path, refs, { spaces: 2 });
};
