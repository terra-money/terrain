# Terrain

<p align="center" >
<a alt="terrain logo is generative, click to see the code!" href="https://editor.p5js.org/iboss-ptk/sketches/-mAM5HzH_">
<img src="./logo.png" alt="terrain logo" width="200"/>
</a>
</p>

<p align="center" >
<b>Terrain</b> – A Terra development environment for seamless smart contract development.
</p>

---

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io) [![Version](https://img.shields.io/npm/v/terrain.svg)](https://npmjs.org/package/terrain) [![Downloads/week](https://img.shields.io/npm/dw/terrain.svg)](https://npmjs.org/package/terrain)

Terrain allows you to:

- Scaffold a template smart contract and frontend for app development.
- Dramatically simplify the development and deployment process.

Terrain is **not**:

- A fully-featured Terra command-line interface (CLI). If you need a fully-featured client, use <a href="https://docs.terra.money/docs/develop/how-to/terrad/using-terrad.html" target="_blank">terrad</a>.
- A Light Client Daemon (LCD). You will still need an RPC endpoint to deploy your contract. <a href="https://github.com/terra-money/LocalTerra#readme" target="_blank">LocalTerra</a> is the recommended option for this.

---

# Table of contents

<!-- toc -->

- [Setup](#setup)
- [Getting Started](#getting-started)
- [Migrating CosmWasm Contracts on Terra](#migrating-cosmwasm-contracts-on-terra)
- [Use Terrain Main Branch Locally](#use-terrain-main-branch-locally)
- [Terrain Commands](#terrain-commands)

<!-- tocstop -->

# Setup

## Download LocalTerra

For testing purposes, we recommend to install and run LocalTerra on your personal computer. Instructions on how to get LocalTerra up and running can be found in the <a href="https://github.com/terra-money/LocalTerra#readme" target="_blank">
LocalTerra documentation</a>.

<sub>**Note:** _If you are using a Mac with an M1 chip, you might need to update your Docker Desktop due to the <a href="https://github.com/docker/for-mac/issues/5561" target="_blank">qemu bug</a>._</sub>

Once all dependencies have been installed, do the following:

1. Clone the LocalTerra repo.

```
git clone https://github.com/terra-money/LocalTerra.git
```

2. Navigate to the newly created `LocalTerra` directory.

```
cd LocalTerra
```

3. Spin up an instance of the environment with `docker-compose`.

```
docker-compose up
```

## Setup Rust

While WASM smart contracts can be written in any programming language, **it is strongly recommended that you utilize Rust**, as it is the only language for which mature libraries and tooling exist for CosmWasm. To complete this tutorial, install the latest version of Rust by following the instructions <a href="https://www.rust-lang.org/tools/install" target="_blank">here</a>. Once Rust is installed on your computer, do the following:

1. Set the default release channel used to update Rust to stable:

```sh
rustup default stable
```

2. Add wasm as the compilation target:

```sh
rustup target add wasm32-unknown-unknown
```

3. Install the necessary dependencies for generating contracts:

```sh
cargo install cargo-generate --features vendored-openssl
cargo install cargo-run-script
```

## Install Node JS and NPM

To run Terrain, you will need to install Node.js and NPM. We recommend that you install <a href="https://nodejs.org/en/download/" target="_blank">Node.js v16 (LTS)</a>. Node Package Manager (NPM) is automatically installed along with your Node.js download.

<sub>**Note:** _Use Node.js v16 (LTS) if you encounter the following error code: `error:0308010C:digital envelope routines::unsupported`_</sub>

# Getting Started

Now that you have completed the initial setup, generate your first smart contract using the procedure described below:

1. Install the terrain package globally.

```sh
npm install -g @terra-money/terrain
```

<sub>**Note:** _If you would like to install terrain locally, you can execute the command `npm install @terra-money/terrain`, without the `-g` flag, while in the directory in which you would like to be able to use the package. You can then execute any terrain commands by prefixing them with `npx`. For example, to scaffold a new project named `my-terra-dapp` with a locally installed terrain package, you would utilize the command `npx terrain new my-terra-dapp`._</sub>

2. Generate your smart contract and corresponding frontend templates.

```sh
terrain new my-terra-dapp
```

3. Navigate to the new `my-terra-dapp` directory.

```sh
cd my-terra-dapp
```

4. Install all necessary Node dependencies in your project.

```sh
npm install
```

## Project Structure

The `terrain new` command generates a project with the following structure:

```
.
├── contracts              # the smart contract directory
│   ├── counter            # template smart contract
│   └── ...
├── frontend               # template frontend application
├── lib                    # predefined task and console functions
├── tasks                  # predefined tasks
├── keys.terrain.js        # keys for signing transactions
├── config.terrain.json    # config for connections and contract deployments
└── refs.terrain.json      # deployed code and contract references
```

## Deployment

The `terrain deploy` command does the following:

- Builds, optimizes and stores the wasm code on the blockchain.
- Instantiates the contract.

To deploy your new counter smart contract, run the following command in the terminal.

```sh
terrain deploy counter --signer test1
```

<sub> **Note:** _You can also store the wasm code and instantiate the contract separately using the command [`terrain code:store CONTRACT`](#terrain-codestore-contract) followed by [`terrain contract:instantiate CONTRACT`](#terrain-contractmigrate-contract). In this case, you must also run the command `terrain sync-refs` in your project directory to update the `refs.terrain.json` file which references contract deployments on all networks._</sub>

In this case, we specify one of the <a href="https://github.com/terra-money/LocalTerra#accounts" target="_blank">preconfigured accounts</a> with balances on LocalTerra, `test1`, as our signer. The signer account will be responsible for paying the gas fee associated with deploying the contract to the Terra blockchain and will be assigned as the owner of the project.

You can also specify the network on which you would like to deploy your contract by adding the `--network` flag. If the network is not specified, as is the case in our above example, your contract will be deployed to `localterra` by default. You may also deploy to `mainnet`, the live Terra blockchain, as well as `testnet`, a network similar to mainnet used for testing.

<br/>

### Deploying on Testnet or Mainnet

The predefined accounts in the `keys.terrain.js` file shown below can be utilized as signers on `testnet`. We will demonstrate how to deploy your smart contract utilizing the preconfigured `custom_tester_1` account. You may also add a personal account to the `keys.terrain.js` file by adding the account name as well as its corresponding private key. You can then use that account as the signer specifying the account name after the `--signer` flag in the `terrain deploy` command.

<sub>**Warning:** _Utilizing a personal account for deployment requires the use of a private key or mnemonic. These are private keys that are generated upon creation of your personal wallet. Saving or utilizing these keys on your personal computer may expose them to malicious actors who could gain access to your personal wallet if they are able to obtain them. You can create a wallet solely for testing purposes to eliminate risk. Alternatively, you can store your private keys as secret enviroment variables which you can then reference utilizing `process.env.SECRET_VAR` in `keys.terrain.json`. Use your private key or mnemonic at your own discretion._</sub>

```js
// can use `process.env.SECRET_MNEMONIC` or `process.env.SECRET_PRIV_KEY`
// to populate secret in CI environment instead of hardcoding

module.exports = {
  custom_tester_1: {
    mnemonic:
      "shiver position copy catalog upset verify cheap library enjoy extend second peasant basic kit polar business document shrug pass chuckle lottery blind ecology stand",
  },
  custom_tester_2: {
    privateKey: "fGl1yNoUnnNUqTUXXhxH9vJU0htlz9lWwBt3fQw+ixw=",
  },
};
```

Prior to deploying your contract, ensure that your signer wallet contains the funds needed to pay for associated transaction fees. You can request funds from the <a href="https://faucet.terra.money/" target="_blank">Terra Testnet Faucet</a> by submitting the wallet address of the account where you would like to receive the funds and clicking on the `Send me tokens` button.

You can retrieve the wallet address associated with the `custom_tester_1` account by utilizing the `terrain console` in your terminal.

```sh
terrain console

terrain > wallets.custom_tester_1.key.accAddress
'terra1qd9fwwgnwmwlu2csv49fgtum3rgms64s8tcavp'
```

After you have received the Luna tokens from the Terra Testnet Faucet, query the balance of your account by utilizing the following command in the terrain console.

```sh
terrain > (await client.bank.balance(wallets.custom_tester_1.key.accAddress))[0]
```

Finally, exit the terrain console and deploy the `counter` smart contract to testnet with the `custom_tester_1` account as the signer.

```sh
terrain deploy counter --signer custom_tester_1 --network testnet
```

## Initializing the Frontend Template

After deployment, the `refs.terrain.json` file is updated in the project directory as well as the `frontend/src` directory. These files contain all contract references on all networks. This information is utilized by terrain's utility functions and also the frontend template. An example of `refs.terrain.json` can be found below:

```json
{
  "localterra": {
    "counter": {
      "codeId": "1",
      "contractAddresses": {
        "default": "terra18vd8fpwxzck93qlwghaj6arh4p7c5n896xzem5"
      }
    }
  },
  "testnet": {
    "counter": {
      "codeId": "18160",
      "contractAddresses": {
        "default": "terra15faphq99pap3fr0dwk46826uqr2usve739l7ms"
      }
    }
  }
}
```

<sub> **Important:** _If you have initialized the contract without using the `terrain deploy` command or have manually changed the `refs.terrain.json` file in the project directory, you will need to sync the references to the `frontend/src` directory in order to ensure frontend functionality. To do so, use the following command: `terrain sync-refs`_</sub>

After you have synced the contract references, navigate to the `frontend` directory and start the application.

1. Navigate to the `frontend` directory.

```sh
cd frontend
```

2. Start the application.

```sh
npm run start
```

<sub> **Note:** _Switching networks in your Terra Station extension will result in a change in reference to the contract address which corresponds with the new network._</sub>

## Run Contract Functions with Terrain

Once you have successfully deployed your project, you can interact with the deployed contract and the underlying blockchain by utilizing functions defined in the `lib/index.js` file. You may also create your own abstractions in this file for querying or executing transactions. The default contents of the `lib/index.js` file are presented below:

```js
// lib/index.js

module.exports = ({ wallets, refs, config, client }) => ({
  getCount: () => client.query("counter", { get_count: {} }),
  increment: (signer = wallets.test1) =>
    client.execute(signer, "counter", { increment: {} }),
});
```

You can call the functions defined above inside of the `terrain console`. An example of this using the `counter` contract is shown below.

```sh
terrain console
terrain > await lib.getCount()
{ count: 0 }
terrain > await lib.increment()
terrain > await lib.getCount()
{ count: 1 }
```

You can also specify which network you would like to interact with by utilizing the `--network` flag.

```
terrain console --network NETWORK
```

## Creating Tasks

You can also utilize the functions available inside of the `lib/index.js` file to create tasks. Tasks are utilized in order to automate the execution of sequential functions or commands. An example task is provided for you in the `tasks/example-with-lib.js` file in your project directory.

```js
// tasks/example-with-lib.js

const { task } = require("@terra-money/terrain");
const lib = require("../lib");

task(async (env) => {
  const { getCount, increment } = lib(env);
  console.log("count 1 = ", await getCount());
  await increment();
  console.log("count 2 = ", await getCount());
});
```

To run the example task shown above, which is located in the `tasks/example-with-lib.js` file, run the following command in the terminal.

```sh
terrain task:run example-with-lib
```

In order to create a new task, run the following command, replacing `<task-name>` with the desired name for your new task.

```sh
terrain task:new <task-name>
```

If you would like to utilize JavaScript in your functions or tasks, you can import Terra.js. The `tasks/example-custom-logic.js` file contains an example of a task that utilizes Terra.js functionality. To learn more about Terra.js, view the <a href="https://terra-money.github.io/terra.js/" target="_blank">Terra.js documentation</a>.

```js
// tasks/example-custom-logic.js

const { task, terrajs } = require("@terra-money/terrain");

// terrajs is basically re-exported terra.js (https://terra-money.github.io/terra.js/)

task(async ({ wallets, refs, config, client }) => {
  console.log("creating new key");
  const key = terrajs.MnemonicKey();
  console.log("private key", key.privateKey.toString("base64"));
  console.log("mnemonic", key.mnemonic);
});
```

---

# Migrating CosmWasm Contracts on Terra

(Thanks to @octalmage)

On Terra, it is possible to initilize contracts as **_migratable_**. A migratable contract allows an adminstrator to upload a new version of a contract and then send a migrate message to move to the new code.

<a href="https://docs.terra.money/docs/develop/dapp/quick-start/contract-migration.html" target="_blank">This tutorial</a> builds on top of the Terrain Quick Start Guide and walks you through a contract migration.

## Adding MigrateMsg to the Contract

In order for a contract to be migratable, it must satisfy the following two requirements:

1. The smart contract handles the `MigrateMsg` transaction.
2. The smart contract has an admininstrator set.

To implement support for `MigrateMsg`, add the message to the `msg.rs` file. To do so, navigate to `msg.rs` and place the following code just above the `InstantiateMsg` struct.

```rust
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct MigrateMsg {}
```

With `MigrateMsg` defined, update the `contract.rs` file. First, update the import from `crate::msg` to include `MigrateMsg`.

```rust
use crate::msg::{CountResponse, ExecuteMsg, InstantiateMsg, QueryMsg, MigrateMsg};
```

Next, add the following method above `instantiate`.

```rust
#[cfg_attr(not(feature = "library"), entry_point)]
pub fn migrate(_deps: DepsMut, _env: Env, _msg: MigrateMsg) -> StdResult<Response> {
    Ok(Response::default())
}
```

## Migrating the Contract

In the previous Terrain tutorial, we deployed the contract, but did not initilize it as migratable.

After adding MigrateMsg to the smart contract, we can redeploy the contract and add the `--set-signer-as-admin` flag. This allows the transaction signer to migrate the contract in the future.

```sh
terrain deploy counter --signer test1 --set-signer-as-admin
```

If you decide to make changes to the deployed contract, you can migrate to the updated code by executing the following command.

```sh
terrain contract:migrate counter --signer test1
```

# Use Terrain Main Branch Locally

In some cases, the latest features or bug fixes may be integrated into the main branch of the <a href="https://github.com/terra-money/terrain" target="_blank">Terrain Github repo</a>, but not yet released to the corresponding <a href="https://www.npmjs.com/package/@terra-money/terrain" target="_blank">npm package</a>. Subsequently, you may want to use the latest version of Terrain available on Github before it has been released to npm. The below described method may also be utilized if you are interested in developing on and contributing to Terrain.

<sub>**Warning:** _Features and bug fixes that are implemented on the latest version of Terrain may still be subject to testing. As such, you should only use the main branch of the Terrain github repo in exceptional circumstances. In all other cases, use the npm package._</sub>

To use the main branch of the Terrain repo on your local machine, do the following:

1. Clone the repo.

```
git clone --branch main --depth 1 https://github.com/terra-money/terrain
```

2. Navigate to the project folder.

```
cd terrain
```

3. Inside the project folder, install all necessary node dependencies.

```
npm install
```

4.  Run the `npm link` command to link the project to your global terrain instance.

```
npm link
```

To unlink the terrain command from the cloned repository and revert back to the default functionality you can run the command below.

```
npm unlink terrain
```

---

# Terrain Commands

<!-- commands -->

* [`terrain code:new NAME`](#terrain-codenew-name)
* [`terrain code:store CONTRACT`](#terrain-codestore-contract)
* [`terrain console`](#terrain-console)
* [`terrain contract:instantiate CONTRACT`](#terrain-contractinstantiate-contract)
* [`terrain contract:migrate [CONTRACT]`](#terrain-contractmigrate-contract)
* [`terrain contract:updateAdmin CONTRACT ADMIN`](#terrain-contractupdateadmin-contract-admin)
* [`terrain deploy CONTRACT`](#terrain-deploy-contract)
* [`terrain help [COMMAND]`](#terrain-help-command)
* [`terrain new NAME`](#terrain-new-name)
* [`terrain sync-refs [FILE]`](#terrain-sync-refs-file)
* [`terrain task:new [TASK]`](#terrain-tasknew-task)
* [`terrain task:run [TASK]`](#terrain-taskrun-task)
* [`terrain test CONTRACT-NAME`](#terrain-test-contract-name)
* [`terrain wallet:new`](#terrain-walletnew)

## `terrain code:new NAME`

Generate new contract.

```
USAGE
  $ terrain code:new [NAME] [--path <value>] [--version <value>]

FLAGS
  --path=<value>     [default: ./contracts] path to keep the contracts
  --version=<value>  [default: 0.16]

DESCRIPTION
  Generate new contract.
```

_View code: [src/commands/code/new.ts](https://github.com/terra-money/terrain/blob/v0.2.0/src/commands/code/new.ts)_

## `terrain code:store CONTRACT`

Store code on chain.

```
USAGE
  $ terrain code:store [CONTRACT] --signer <value> [--no-rebuild] [--network <value>] [--config-path <value>]
    [--refs-path <value>] [--keys-path <value>] [--code-id <value>]

FLAGS
  --code-id=<value>
  --config-path=<value>  [default: ./config.terrain.json]
  --keys-path=<value>    [default: ./keys.terrain.js]
  --network=<value>      [default: localterra]
  --no-rebuild
  --refs-path=<value>    [default: ./refs.terrain.json]
  --signer=<value>       (required)

DESCRIPTION
  Store code on chain.
```

_View code: [src/commands/code/store.ts](https://github.com/terra-money/terrain/blob/v0.2.0/src/commands/code/store.ts)_

## `terrain console`

Start a repl console that provides context and convinient utilities to interact with the blockchain and your contracts.

```
USAGE
  $ terrain console [--network <value>] [--config-path <value>] [--refs-path <value>] [--keys-path <value>]

FLAGS
  --config-path=<value>  [default: config.terrain.json]
  --keys-path=<value>    [default: keys.terrain.js]
  --network=<value>      [default: localterra]
  --refs-path=<value>    [default: refs.terrain.json]

DESCRIPTION
  Start a repl console that provides context and convinient utilities to interact with the blockchain and your
  contracts.
```

_View code: [src/commands/console.ts](https://github.com/terra-money/terrain/blob/v0.2.0/src/commands/console.ts)_

## `terrain contract:instantiate CONTRACT`

Instantiate the contract.

```
USAGE
  $ terrain contract:instantiate [CONTRACT] --signer <value> [--network <value>] [--config-path <value>] [--refs-path
    <value>] [--keys-path <value>] [--instance-id <value>] [--code-id <value>] [--set-signer-as-admin]

FLAGS
  --code-id=<value>      target code id for migration, can do only once after columbus-5 upgrade
  --config-path=<value>  [default: ./config.terrain.json]
  --instance-id=<value>  [default: default]
  --keys-path=<value>    [default: ./keys.terrain.js]
  --network=<value>      [default: localterra]
  --refs-path=<value>    [default: ./refs.terrain.json]
  --set-signer-as-admin
  --signer=<value>       (required)

DESCRIPTION
  Instantiate the contract.
```

_View code: [src/commands/contract/instantiate.ts](https://github.com/terra-money/terrain/blob/v0.2.0/src/commands/contract/instantiate.ts)_

## `terrain contract:migrate [CONTRACT]`

Migrate the contract.

```
USAGE
  $ terrain contract:migrate [CONTRACT] --signer <value> [--no-rebuild] [--network <value>] [--config-path <value>]
    [--refs-path <value>] [--keys-path <value>] [--instance-id <value>] [--code-id <value>]

FLAGS
  --code-id=<value>      target code id for migration
  --config-path=<value>  [default: ./config.terrain.json]
  --instance-id=<value>  [default: default]
  --keys-path=<value>    [default: ./keys.terrain.js]
  --network=<value>      [default: localterra]
  --no-rebuild           deploy the wasm bytecode as is.
  --refs-path=<value>    [default: ./refs.terrain.json]
  --signer=<value>       (required)

DESCRIPTION
  Migrate the contract.
```

_View code: [src/commands/contract/migrate.ts](https://github.com/terra-money/terrain/blob/v0.2.0/src/commands/contract/migrate.ts)_

## `terrain contract:updateAdmin CONTRACT ADMIN`

Update the admin of a contract.

```
USAGE
  $ terrain contract:updateAdmin [CONTRACT] [ADMIN] --signer <value> [--network <value>] [--config-path <value>]
    [--refs-path <value>] [--keys-path <value>] [--instance-id <value>]

FLAGS
  --config-path=<value>  [default: ./config.terrain.json]
  --instance-id=<value>  [default: default]
  --keys-path=<value>    [default: ./keys.terrain.js]
  --network=<value>      [default: localterra]
  --refs-path=<value>    [default: ./refs.terrain.json]
  --signer=<value>       (required)

DESCRIPTION
  Update the admin of a contract.
```

_View code: [src/commands/contract/updateAdmin.ts](https://github.com/terra-money/terrain/blob/v0.2.0/src/commands/contract/updateAdmin.ts)_

## `terrain deploy CONTRACT`

Build wasm bytecode, store code on chain and instantiate.

```
USAGE
  $ terrain deploy [CONTRACT] --signer <value> [--no-rebuild] [--network <value>] [--config-path <value>]
    [--refs-path <value>] [--keys-path <value>] [--instance-id <value>] [--set-signer-as-admin] [--admin-address
    <value>] [--frontend-refs-path <value>] [--arm64]

FLAGS
  --admin-address=<value>       set custom address as contract admin to allow migration.
  --arm64                       use rust-optimizer-arm64 for optimization. Not recommended for production, but it will
                                optimize quicker on arm64 hardware during development.
  --config-path=<value>         [default: ./config.terrain.json]
  --frontend-refs-path=<value>  [default: ./frontend/src/refs.terrain.json]
  --instance-id=<value>         [default: default]
  --keys-path=<value>           [default: ./keys.terrain.js]
  --network=<value>             [default: localterra]
  --no-rebuild                  deploy the wasm bytecode as is.
  --refs-path=<value>           [default: ./refs.terrain.json]
  --set-signer-as-admin         set signer (deployer) as admin to allow migration.
  --signer=<value>              (required)

DESCRIPTION
  Build wasm bytecode, store code on chain and instantiate.
```

_View code: [src/commands/deploy.ts](https://github.com/terra-money/terrain/blob/v0.2.0/src/commands/deploy.ts)_

## `terrain help [COMMAND]`

Display help for terrain.

```
USAGE
  $ terrain help [COMMAND] [--all]

ARGUMENTS
  COMMAND  command to show help for

FLAGS
  --all  see all commands in CLI

DESCRIPTION
  Display help for terrain.
```

_View code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.18/src/commands/help.ts)_

## `terrain new NAME`

Create new dapp from a template.

```
USAGE
  $ terrain new [NAME] [--path <value>] [--framework next|vue|vite|lit|svelte|react] [--version <value>]

FLAGS
  --framework=<option>  [default: react] Choose the frontend framework you want to use. Non-react framework options have
                        better wallet-provider support but less streamlined contract integration.
                        <options: next|vue|vite|lit|svelte|react>
  --path=<value>        path to keep the project
  --version=<value>     [default: 0.16]

DESCRIPTION
  Create new dapp from a template.

EXAMPLES
  $ terrain new awesome-dapp

  $ terrain new --framework vue awesome-dapp

  $ terrain new awesome-dapp --path path/to/dapp

  $ terrain new --framework next awesome-dapp --path path/to/dapp
```

_View code: [src/commands/new.ts](https://github.com/terra-money/terrain/blob/v0.2.0/src/commands/new.ts)_

## `terrain sync-refs [FILE]`

Sync configuration with frontend app.

```
USAGE
  $ terrain sync-refs [FILE] [--refs-path <value>] [--dest <value>]

FLAGS
  --dest=<value>       [default: ./frontend/src/refs.terrain.json]
  --refs-path=<value>  [default: ./refs.terrain.json]

DESCRIPTION
  Sync configuration with frontend app.
```

_View code: [src/commands/sync-refs.ts](https://github.com/terra-money/terrain/blob/v0.2.0/src/commands/sync-refs.ts)_

## `terrain task:new [TASK]`

Create new task.

```
USAGE
  $ terrain task:new [TASK]

DESCRIPTION
  Create new task.
```

_View code: [src/commands/task/new.ts](https://github.com/terra-money/terrain/blob/v0.2.0/src/commands/task/new.ts)_

## `terrain task:run [TASK]`

Run predefined task.

```
USAGE
  $ terrain task:run [TASK] [--network <value>] [--config-path <value>] [--refs-path <value>] [--keys-path
    <value>]

FLAGS
  --config-path=<value>  [default: config.terrain.json]
  --keys-path=<value>    [default: keys.terrain.js]
  --network=<value>      [default: localterra]
  --refs-path=<value>    [default: refs.terrain.json]

DESCRIPTION
  Run predefined task.
```

_View code: [src/commands/task/run.ts](https://github.com/terra-money/terrain/blob/v0.2.0/src/commands/task/run.ts)_

## `terrain test CONTRACT-NAME`

Runs unit tests for a contract directory.

```
USAGE
  $ terrain test [CONTRACT-NAME] [--no-fail-fast]

FLAGS
  --no-fail-fast  Run all tests regardless of failure.

DESCRIPTION
  Runs unit tests for a contract directory.

EXAMPLES
  $ terrain test counter

  $ terrain test counter --no-fail-fast
```

_View code: [src/commands/test.ts](https://github.com/terra-money/terrain/blob/v0.2.0/src/commands/test.ts)_

## `terrain wallet:new`

Generate a new wallet.

```
USAGE
  $ terrain wallet:new [--outfile <value>] [--index <value>]

FLAGS
  --index=<value>    key index to use, default value is 0
  --outfile=<value>  absolute path to store the mnemonic key to. If omitted, output to stdout

DESCRIPTION
  Generate a new wallet.
```

_View code: [src/commands/wallet/new.ts](https://github.com/terra-money/terrain/blob/v0.2.0/src/commands/wallet/new.ts)_

<!-- commandsstop -->
