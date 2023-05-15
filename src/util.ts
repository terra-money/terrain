import R from 'ramda';
import { loadConnections } from './config';

export const getFeeDenom = (network: string, prefix: string) => {
  const connections = loadConnections(prefix);
  return Object.keys(connections(network).gasPrices)[0];
};

export const setCodeId = (network: string, chainID: string, contract: string, codeId: number) => R.set(R.lensPath([network, chainID, contract, 'codeId']), codeId);

export const setContractAddress = (
  network: string,
  chainID: string,
  contract: string,
  instanceId: string,
  contractAddress: string,
) => R.set(
  R.lensPath([network, chainID, contract, 'contractAddresses', instanceId]),
  contractAddress,
);

export const isLocalNetwork = (network: string) => network === 'local' || network === 'localterra';

export const getNetworkName = (network: string) => (
  isLocalNetwork(network)
    ? 'local network'
    : `${network[0].toUpperCase()}${network.substring(1)}`);
