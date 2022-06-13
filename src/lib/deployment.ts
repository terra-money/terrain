/* eslint-disable no-await-in-loop */
import Os from "os";
import {
  AccAddress,
  LCDClient,
  MsgInstantiateContract,
  MsgMigrateCode,
  MsgMigrateContract,
  MsgStoreCode,
  Wallet,
} from "@terra-money/terra.js";
import { parse } from "toml";
import { execSync } from "child_process";
import * as fs from "fs-extra";
import { cli } from "cli-ux";
import * as YAML from "yaml";
import { waitForInclusionInBlock } from "../lib/waitForInclusionBlock";
import {
  ContractConfig,
  loadRefs,
  saveRefs,
  setCodeId,
  setContractAddress,
} from "../config";
import path from "path";

type BuildParams = {
  contract?: string;
  workspace?: string;
};

export const build = async ({ contract, workspace }: BuildParams) => {
  if (contract === undefined && workspace === undefined) {
    cli.error(`No workspace or contract was defined.`);
    return;
  }
  if (contract) {
    buildContract({ contract, workspace });
    return;
  }
  if (workspace) {
    buildWorkspace({ workspace });
    return;
  }
};

type BuildContractParams = {
  contract: string;
  workspace?: string;
};

const buildContract = async ({ contract, workspace }: BuildContractParams) => {
  const folder = path.join(workspace ?? "", "contracts", contract);
  process.chdir(folder);

  const { package: pkg } = parse(fs.readFileSync("./Cargo.toml", "utf-8"));
  if (contract !== pkg.name) {
    cli.error(`Change the package name in Cargo.toml to ${contract} to build`);
  }

  execSync("cargo wasm", { stdio: "inherit" });
  process.chdir("../..");
};

type BuildWorkspaceParams = {
  workspace: string;
};

const buildWorkspace = async ({ workspace }: BuildWorkspaceParams) => {
  const folder = workspace;
  process.chdir(folder);

  const { workspace: wksp } = parse(fs.readFileSync("./Cargo.toml", "utf-8"));
  console.log(wksp);

  if (wksp === undefined) {
    cli.error(`The Cargo.toml must define a workspace`);
  }

  execSync("cargo build", { stdio: "inherit" });

  process.chdir("../");
};

type OptimizeParams = {
  contract?: string;
  workspace?: string;
  arm64: boolean | undefined;
};

export const optimize = async ({
  contract,
  workspace,
  arm64,
}: OptimizeParams) => {
  if (contract === undefined && workspace === undefined) {
    cli.error(`No workspace or contract was defined.`);
    return;
  }

  if (contract) {
    optimizeContract({ contract, workspace, arm64 });
    return;
  }

  if (workspace) {
    optimizeWorkspace({ workspace, arm64 });
  }
};

type OptimizeContractParams = {
  contract: string;
  workspace?: string;
  arm64: boolean | undefined;
};

const optimizeContract = async ({
  contract,
  workspace,
  arm64,
}: OptimizeContractParams) => {
  const folder = path.join(workspace ?? "", "contracts", contract);
  process.chdir(folder);

  const image = `cosmwasm/rust-optimizer${arm64 ? "-arm64" : ""}:0.12.5`;

  execDockerOptimization(image, contract);

  process.chdir(workspace ? "../../.." : "../..");
};

type OptimizeWorkspaceParams = {
  workspace: string;
  arm64: boolean | undefined;
};

const optimizeWorkspace = async ({
  workspace,
  arm64,
}: OptimizeWorkspaceParams) => {
  const folder = workspace;
  process.chdir(folder);

  const image = `cosmwasm/workspace-optimizer${arm64 ? "-arm64" : ""}:0.12.5`;

  execDockerOptimization(image, workspace);

  process.chdir("../");
};

const execDockerOptimization = (image: string, cache: string) => {
  const dir = Os.platform() === "win32" ? "%cd%" : "$(pwd)";

  execSync(
    `docker run --rm -v "${dir}":/code \
      --mount type=volume,source="${cache}_cache",target=/code/target \
      --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
      ${image}`,
    { stdio: "inherit" }
  );
};

type StoreCodeParams = {
  conf: ContractConfig;
  network: string;
  refsPath: string;
  lcd: LCDClient;
  contract: string;
  workspace?: string;
  signer: Wallet;
  codeId?: number;
  arm64?: boolean;
};

export const storeCode = async ({
  contract,
  workspace,
  signer,
  network,
  refsPath,
  lcd,
  codeId,
  arm64,
}: StoreCodeParams) => {
  let wasmByteCodeFilename = `${contract.replace(/-/g, "_")}`;

  // rust-optimizer-arm64 produces a file with the `-aarch64` suffix.
  if (arm64) {
    wasmByteCodeFilename += "-aarch64";
  }

  wasmByteCodeFilename += ".wasm";

  const artifactFileName = workspace
    ? path.join(workspace, "artifacts", wasmByteCodeFilename)
    : path.join("contracts", contract, "artifacts", wasmByteCodeFilename);

  const wasmByteCode = fs.readFileSync(artifactFileName).toString("base64");

  cli.action.start("storing wasm bytecode on chain");

  const storeCodeTx = await signer.createAndSignTx({
    msgs: [
      typeof codeId !== "undefined"
        ? new MsgMigrateCode(signer.key.accAddress, codeId, wasmByteCode)
        : new MsgStoreCode(signer.key.accAddress, wasmByteCode),
    ],
  });

  const result = await lcd.tx.broadcastSync(storeCodeTx);
  if ("code" in result) {
    return cli.error(result.raw_log);
  }

  const res = await waitForInclusionInBlock(lcd, result.txhash);

  cli.action.stop();

  if (typeof res === "undefined") {
    return cli.error("transaction not included in a block before timeout");
  }

  try {
    const savedCodeId = JSON.parse((res && res.raw_log) || "")[0]
      .events.find((msg: { type: string }) => msg.type === "store_code")
      .attributes.find((attr: { key: string }) => attr.key === "code_id").value;

    const updatedRefs = setCodeId(
      network,
      contract,
      savedCodeId
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

  const instantiateTx = await signer.createAndSignTx({
    sequence: manualSequence,
    msgs: [
      new MsgInstantiateContract(
        signer.key.accAddress,
        admin, // can migrate
        codeId,
        instantiation.instantiateMsg,
        undefined,
        "Instantiate"
      ),
    ],
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

  const event =
    log[0].events.find(
      (event: { type: string }) => event.type === "instantiate_contract"
    ) ??
    log[0].events.find(
      (event: { type: string }) => event.type === "instantiate"
    );

  const contractAddress: string = event.attributes.find(
    (attr: { key: string }) => attr.key === "_contract_address"
  ).value;

  const updatedRefs = setContractAddress(
    network,
    contract,
    instanceId,
    contractAddress
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
    `migrating contract with address ${contractAddress} to code id: ${codeId}`
  );

  const migrateTx = await signer.createAndSignTx({
    msgs: [
      new MsgMigrateContract(
        signer.key.accAddress,
        contractAddress,
        codeId,
        instantiation.instantiateMsg
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
    contractAddress
  )(loadRefs(refsPath));
  saveRefs(updatedRefs, refsPath);

  cli.log(YAML.stringify(log));
};
