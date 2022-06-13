/* eslint-disable no-await-in-loop */
import {
  AccAddress,
  LCDClient,
  MsgInstantiateContract,
  MsgMigrateCode,
  MsgMigrateContract,
  MsgStoreCode,
  Wallet,
  SignerData,
  CreateTxOptions,
} from '@terra-money/terra.js';
import { parse } from 'toml';
import { execSync } from 'child_process';
import * as fs from 'fs-extra';
import { cli } from 'cli-ux';
import * as YAML from 'yaml';
import { waitForInclusionInBlock } from '../lib/waitForInclusionBlock';
import {
  ContractConfig,
  loadRefs,
  saveRefs,
  setCodeId,
  setContractAddress,
} from '../config';
import TerrainCLI from '../TerrainCLI';

type StoreCodeParams = {
  conf: ContractConfig;
  network: string;
  refsPath: string;
  lcd: LCDClient;
  noRebuild: boolean;
  contract: string;
  signer: Wallet;
  codeId?: number;
  arm64?: boolean;
};

export const storeCode = async ({
  noRebuild,
  contract,
  signer,
  network,
  refsPath,
  lcd,
  codeId,
  arm64,
}: StoreCodeParams) => {
  process.chdir(`contracts/${contract}`);
  const { package: pkg } = parse(fs.readFileSync('./Cargo.toml', 'utf-8'));
  if (contract !== pkg.name) {
    cli.error(`Change the package name in Cargo.toml to ${contract} to build`);
  }

  if (!noRebuild) {
    execSync('cargo wasm', { stdio: 'inherit' });

    if (arm64) {
      // Need to use the rust-optimizer-arm64 image on arm64 architecture.
      execSync('docker run --rm -v "$(pwd)":/code \
        --mount type=volume,source="$(basename "$(pwd)")_cache",target=/code/target \
        --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
        cosmwasm/rust-optimizer-arm64:0.12.5', { stdio: 'inherit' });
    } else {
      execSync('docker run --rm -v "$(pwd)":/code \
        --mount type=volume,source="$(basename "$(pwd)")_cache",target=/code/target \
        --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
        cosmwasm/rust-optimizer:0.12.5', { stdio: 'inherit' });
    }
  }

  let wasmByteCodeFilename = `${contract.replace(/-/g, '_')}`;

  // rust-optimizer-arm64 produces a file with the `-aarch64` suffix.
  if (arm64) {
    wasmByteCodeFilename += '-aarch64';
  }

  wasmByteCodeFilename += '.wasm';

  const wasmByteCode = fs
    .readFileSync(`artifacts/${wasmByteCodeFilename}`)
    .toString('base64');

  cli.action.start('storing wasm bytecode on chain');

  const storeCodeTx = await signer.createAndSignTx({
    msgs: [
      typeof codeId !== 'undefined'
        ? new MsgMigrateCode(signer.key.accAddress, codeId, wasmByteCode)
        : new MsgStoreCode(signer.key.accAddress, wasmByteCode),
    ],
  });
  const result = await lcd.tx.broadcastSync(storeCodeTx);
  if ('code' in result) {
    return cli.error(result.raw_log);
  }

  const res = await waitForInclusionInBlock(lcd, result.txhash);

  cli.action.stop();

  if (typeof res === 'undefined') {
    return cli.error('transaction not included in a block before timeout');
  }

  try {
    const savedCodeId = JSON.parse((res && res.raw_log) || '')[0]
      .events.find((msg: { type: string }) => msg.type === 'store_code')
      .attributes.find((attr: { key: string }) => attr.key === 'code_id').value;

    process.chdir('../..');
    const updatedRefs = setCodeId(
      network,
      contract,
      savedCodeId,
    )(loadRefs(refsPath));
    saveRefs(updatedRefs, refsPath);
    cli.log(`code is stored at code id: ${savedCodeId}`);

    return savedCodeId;
  } catch (error) {
    if (error instanceof SyntaxError) {
      cli.error(res.raw_log);
    } else {
      cli.error(`Unexpcted Error: ${error}`);
    }
  }
};

type InstantiateParams = {
  conf: ContractConfig;
  signer: Wallet;
  network: string;
  refsPath: string;
  lcd: LCDClient;
  admin?: AccAddress;
  contract: string;
  codeId: number;
  instanceId: string;
  sequence?: number;
};

export const instantiate = async ({
  conf,
  refsPath,
  network,
  lcd,
  signer,
  admin,
  contract,
  codeId,
  instanceId,
  sequence,
}: InstantiateParams) => {
  const { instantiation } = conf;

  cli.action.start(`instantiating contract with code id: ${codeId}`);

  // Allow manual account sequences.
  const manualSequence = sequence || (await signer.sequence());

  // Create signerData and txOptions for fee estimation.
  const accountInfo = await lcd.auth.accountInfo(signer.key.accAddress);
  const signerData: [SignerData] = [{
    sequenceNumber: manualSequence,
    publicKey: accountInfo.getPublicKey(),
  }];
  const txOptions: CreateTxOptions = {
    msgs: [
      new MsgInstantiateContract(
        signer.key.accAddress,
        admin, // can migrate
        codeId,
        instantiation.instantiateMsg,
        undefined,
        'Instantiate',
      ),
    ],
  };

  // Set default terraDenom and feeDenoms value if not specified.
  if (!txOptions.feeDenoms) {
    txOptions.feeDenoms = ['uluna'];
  }
  const terraDenom = 'LUNA';

  // Prompt user to accept gas fee for contract initialization if network is mainnet.
  if (network !== 'mainnet') {
    const feeEstimate = await lcd.tx.estimateFee(signerData, txOptions);
    const gasFee = Number(feeEstimate.amount.get(txOptions.feeDenoms[0])!.amount) / 1000000;
    await TerrainCLI.anykey(`The gas needed to deploy the '${contract}' contact is estimated to be ${gasFee} ${terraDenom}. Press any key to continue or "ctl+c" to exit`);
  }

  const instantiateTx = await signer.createAndSignTx({
    sequence: manualSequence,
    ...txOptions,
  });

  const result = await lcd.tx.broadcastSync(instantiateTx);
  const res = await waitForInclusionInBlock(lcd, result.txhash);

  let log = [];
  try {
    log = JSON.parse(res!.raw_log);
  } catch (error) {
    cli.action.stop();
    if (error instanceof SyntaxError && res) {
      cli.error(res.raw_log);
    } else {
      cli.error(`Unexpected Error: ${error}`);
    }
  }

  cli.action.stop();

  const contractAddress: string = log[0].events
    .find((event: { type: string }) => event.type === 'instantiate')
    .attributes.find(
      (attr: { key: string }) => attr.key === '_contract_address',
    ).value;

  const updatedRefs = setContractAddress(
    network,
    contract,
    instanceId,
    contractAddress,
  )(loadRefs(refsPath));
  saveRefs(updatedRefs, refsPath);

  cli.log(YAML.stringify(log));

  return contractAddress;
};

type MigrateParams = {
  conf: ContractConfig;
  signer: Wallet;
  contract: string;
  codeId: number;
  network: string;
  instanceId: string;
  refsPath: string;
  lcd: LCDClient;
};

export const migrate = async ({
  conf,
  refsPath,
  lcd,
  signer,
  contract,
  codeId,
  network,
  instanceId,
}: MigrateParams) => {
  const { instantiation } = conf;
  const refs = loadRefs(refsPath);

  const contractAddress = refs[network][contract].contractAddresses[instanceId];

  cli.action.start(`migrating contract with address ${contractAddress} to code id: ${codeId}`);

  const migrateTx = await signer.createAndSignTx({
    msgs: [
      new MsgMigrateContract(
        signer.key.accAddress,
        contractAddress,
        codeId,
        instantiation.instantiateMsg,
      ),
    ],
  });

  const resInstant = await lcd.tx.broadcast(migrateTx);

  let log = [];
  try {
    log = JSON.parse(resInstant.raw_log);
  } catch (error) {
    cli.action.stop();
    if (error instanceof SyntaxError) {
      cli.error(resInstant.raw_log);
    } else {
      cli.error(`Unexpcted Error: ${error}`);
    }
  }

  cli.action.stop();

  const updatedRefs = setContractAddress(
    network,
    contract,
    instanceId,
    contractAddress,
  )(loadRefs(refsPath));
  saveRefs(updatedRefs, refsPath);

  cli.log(YAML.stringify(log));
};
