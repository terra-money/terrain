/* eslint-disable no-await-in-loop */
import Os from 'os';
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
import path from 'path';
import {
  ContractConfig,
  loadRefs,
  saveRefs,
  setCodeId,
  setContractAddress,
} from '../config';
import TerrainCLI from '../TerrainCLI';
import useARM64 from './useARM64';

type BuildParams = {
  contract: string;
};

export const build = async ({ contract }: BuildParams) => {
  const startingDirectory = process.cwd();
  const folder = path.join('contracts', contract);
  process.chdir(folder);

  const { package: pkg } = parse(fs.readFileSync('./Cargo.toml', 'utf-8'));
  if (contract !== pkg.name) {
    cli.error(`Change the package name in Cargo.toml to ${contract} to build`);
  }

  execSync('cargo wasm', { stdio: 'inherit' });
  process.chdir(startingDirectory);
};

const execDockerOptimization = (image: string, cache: string) => {
  const dir = Os.platform() === 'win32' ? '%cd%' : '$(pwd)';

  execSync(
    `docker run --rm -v "${dir}":/code \
      --mount type=volume,source="${cache}_cache",target=/code/target \
      --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
      ${image}`,
    { stdio: 'inherit' },
  );
};

type OptimizeContractParams = {
  contract: string;
  arm64: boolean | undefined;
};

const optimizeContract = async ({
  contract,
  arm64,
}: OptimizeContractParams) => {
  const startingDirectory = process.cwd();
  const folder = path.join('contracts', contract);
  process.chdir(folder);

  const image = `cosmwasm/rust-optimizer${arm64 ? '-arm64' : ''}:0.12.6`;

  execDockerOptimization(image, contract);

  process.chdir(startingDirectory);
};

const optimizeWorkspace = async ({
  contract,
  arm64,
}: OptimizeContractParams) => {
  const image = `cosmwasm/workspace-optimizer${arm64 ? '-arm64' : ''}:0.12.6`;
  execDockerOptimization(image, contract);
};

type OptimizeParams = {
  contract: string;
  useCargoWorkspace?: boolean,
  network?: string,
};

export const optimize = async ({
  contract,
  useCargoWorkspace,
  network,
}: OptimizeParams) => {
  const arm64 = useARM64(network);
  if (useCargoWorkspace) {
    optimizeWorkspace({ contract, arm64 });
  } else {
    optimizeContract({ contract, arm64 });
  }
};

type StoreCodeParams = {
  conf: ContractConfig;
  network: string;
  refsPath: string;
  lcd: LCDClient;
  contract: string;
  noRebuild?: boolean;
  signer: Wallet;
  codeId?: number;
  useCargoWorkspace?: boolean,
};

export const storeCode = async ({
  contract,
  signer,
  network,
  refsPath,
  lcd,
  codeId,
  noRebuild,
  useCargoWorkspace,
}: StoreCodeParams) => {
  const arm64 = useARM64(network);

  if (!noRebuild) {
    await build({ contract });
    await optimize({ contract, useCargoWorkspace, network });
  }

  let wasmByteCodeFilename = `${contract.replace(/-/g, '_')}`;

  // rust-optimizer-arm64 produces a file with the `-aarch64` suffix.
  if (arm64) {
    wasmByteCodeFilename += '-aarch64';
  }

  wasmByteCodeFilename += '.wasm';

  // Create boolean to check if user is attempting to store ARM64 wasm binary on mainnet.
  const wasmFiles = fs.readdirSync(path.join('contracts', contract, 'artifacts'));
  const storingARM64Mainnet = (
    !wasmFiles.includes(wasmByteCodeFilename)
    && process.arch === 'arm64'
    && network === 'mainnet'
  );

  // Check if user is attempting to store ARM64 wasm binary on mainnet.
  // If so, reoptimize to default wasm binary to store on mainnet.
  if (storingARM64Mainnet) {
    TerrainCLI.alert(`
ARM64 wasm files should not be stored on mainnet.\n
Rebuilding contract to deploy default wasm binary.
    `, '🚨 ARM64 Wasm Detected 🚨');

    await optimize({ contract, useCargoWorkspace, network });
  }

  const artifactFileName = useCargoWorkspace
    ? path.join('artifacts', wasmByteCodeFilename)
    : path.join('contracts', contract, 'artifacts', wasmByteCodeFilename);

  const wasmByteCode = fs.readFileSync(artifactFileName).toString('base64');

  cli.action.start('storing wasm bytecode on chain');

  const storeCodeTx = await signer.createAndSignTx({
    msgs: [
      typeof codeId !== 'undefined'
        ? new MsgMigrateCode(signer.key.accAddress, codeId, wasmByteCode)
        : new MsgStoreCode(signer.key.accAddress, wasmByteCode),
    ],
  });

  const res = await lcd.tx.broadcast(storeCodeTx);

  try {
    const savedCodeId = JSON.parse((res && res.raw_log) || '')[0]
      .events.find((msg: { type: string }) => msg.type === 'store_code')
      .attributes.find((attr: { key: string }) => attr.key === 'code_id').value;

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
      cli.error(`Unexpected Error: ${error}`);
    }
  }

  return undefined;
};

type InstantiateParams = {
  conf: ContractConfig;
  signer: Wallet;
  network: string;
  refsPath: string;
  lcd: LCDClient;
  admin?: AccAddress;
  contract: string;
  codeId?: number;
  instanceId?: string;
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

  // Ensure contract refs are available in refs.terrain.json.
  const refs = loadRefs(refsPath);
  if (!(network in refs) || !(contract in refs[network])) {
    TerrainCLI.error(`Contract '${contract}' has not been deployed on the '${network}' network.`);
  }

  const actualCodeId = codeId || refs[network][contract].codeId;

  cli.action.start(
    `instantiating contract with msg: ${JSON.stringify(
      instantiation.instantiateMsg,
    )}`,
  );

  // Allow manual account sequences.
  const manualSequence = sequence || (await signer.sequence());

  // Create signerData and txOptions for fee estimation.
  const accountInfo = await lcd.auth.accountInfo(signer.key.accAddress);
  const signerData: [SignerData] = [
    {
      sequenceNumber: manualSequence,
      publicKey: accountInfo.getPublicKey(),
    },
  ];
  const txOptions: CreateTxOptions = {
    msgs: [
      new MsgInstantiateContract(
        signer.key.accAddress,
        admin, // can migrate
        actualCodeId,
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
  if (network === 'mainnet') {
    const feeEstimate = await lcd.tx.estimateFee(signerData, txOptions);
    const gasFee = Number(feeEstimate.amount.get(txOptions.feeDenoms[0])!.amount) / 1000000;
    await TerrainCLI.anykey(
      `The gas needed to deploy the '${contract}' contact is estimated to be ${gasFee} ${terraDenom}. Press any key to continue or "ctl+c" to exit`,
    );
  }

  const instantiateTx = await signer.createAndSignTx({
    sequence: manualSequence,
    ...txOptions,
  });

  const res = await lcd.tx.broadcast(instantiateTx);

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

  const event = log[0].events.find(
    (e: { type: string }) => e.type === 'instantiate_contract',
  )
    ?? log[0].events.find(
      (e: { type: string }) => e.type === 'instantiate',
    );

  const contractAddress: string = event.attributes.find(
    (attr: { key: string }) => attr.key === '_contract_address',
  ).value;

  const updatedRefs = setContractAddress(
    network,
    contract,
    instanceId || 'default',
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

  cli.action.start(
    `migrating contract with address ${contractAddress} to code id: ${codeId}`,
  );

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
      cli.error(`Unexpected Error: ${error}`);
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
