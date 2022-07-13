import { MnemonicKey, RawKey } from '@terra-money/terra.js';
import * as R from 'ramda';
import { config, loadConfig, loadKeys } from './config';

const _global = {
  contracts: {
    counter: {
      instantiation: {
        instantiateMsg: { count: 5 },
      },
    },
  },
  _base: {
    instantiation: {
      instantiateMsg: {},
    },
  },
};

const _globalWithOverrides = R.mergeDeepRight(_global, {
  _base: {
    instantiation: {
      instantiateMsg: { count: 0 },
    },
  },
  contracts: {
    contract_a: {
      instantiation: {
        instantiateMsg: { count: 5 },
      },
    },
  },
}) as any;

const local = {
  _base: {
    instantiation: {
      instantiateMsg: { count: 99 },
    },
  },
  contracts: {
    contract_a: {
      instantiation: {
        instantiateMsg: { count: 100 },
      },
    },
  },
} as any;

test('config without overrides should return global base for any contract in any network', () => {
  const conf = config({ _global });

  expect(conf('local', 'contract_a')).toEqual(_global._base);
  expect(conf('mainnet', 'contract_b')).toEqual(_global._base);
});

test('config without overrides should return specific config for counter contract', () => {
  const conf = config({ _global });

  expect(conf('local', 'counter')).toEqual(_global.contracts.counter);
  expect(conf('mainnet', 'counter')).toEqual(_global.contracts.counter);
});

test('config with overrides in global should return overriden value for all networks', () => {
  const conf = config({ _global: _globalWithOverrides });

  const contractAUpdated = {
    instantiation: {
      instantiateMsg: { count: 5 },
    },
  };

  expect(conf('local', 'contract_a')).toEqual(contractAUpdated);
  expect(conf('testnet', 'contract_a')).toEqual(contractAUpdated);
  expect(conf('mainnet', 'contract_a')).toEqual(contractAUpdated);

  expect(conf('local', 'contract_random')).toEqual(_globalWithOverrides._base);
});

test('config with overrides in _base for the network should overrides for all the contract within the network', () => {
  const conf = config({ _global, local });
  const localContractA = {
    instantiation: {
      instantiateMsg: { count: 100 },
    },
  };
  const localOtherContract = {
    instantiation: {
      instantiateMsg: { count: 99 },
    },
  };

  expect(conf('local', 'contract_a')).toEqual(localContractA);
  expect(conf('local', 'contract_b')).toEqual(localOtherContract);
  expect(conf('local', 'contract_c')).toEqual(localOtherContract);
  expect(conf('mainnet', 'contract_a')).toEqual(_global._base);
});

test('load config', () => {
  const conf = loadConfig();
  expect(conf('localterra', 'contract_a')).toEqual({
    instantiation: {
      instantiateMsg: { count: 0 },
    },
  });
});

// TODO: keys were moved into a separate repo.
test.skip('load wallets', () => {
  const wallets = loadKeys();
  const ct1 = wallets.custom_tester_1 as MnemonicKey;
  expect(ct1.mnemonic).toBe(
    'shiver position copy catalog upset verify cheap library enjoy extend second peasant basic kit polar business document shrug pass chuckle lottery blind ecology stand',
  );

  const ct2 = wallets.custom_tester_2 as RawKey;
  expect(ct2.privateKey.toString('base64')).toBe(
    'fGl1yNoUnnNUqTUXXhxH9vJU0htlz9lWwBt3fQw+ixw=',
  );
});
