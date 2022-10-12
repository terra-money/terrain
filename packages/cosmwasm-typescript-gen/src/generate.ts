import { pascal } from "case";
import { header } from "./header";
import { join } from "path";
import { sync as mkdirp } from "mkdirp";
import * as w from "@octalmage/wasm-ast-types";
import * as t from "@babel/types";
import { writeFileSync } from "fs";
import generate from "@babel/generator";
import { clean } from "./clean";
import { getMessageProperties, ContractInfo } from "@octalmage/wasm-ast-types";
import { findAndParseTypes, findExecuteMsg, findQueryMsg } from "./utils";

export default async (name: string, contract: ContractInfo, outPath: string) => {
  const { schemas } = contract;
  const Contract = pascal(`${name}Client`) + ".ts";

  const QueryMsg = findQueryMsg(schemas);
  const ExecuteMsg = findExecuteMsg(schemas);
  const typeHash = await findAndParseTypes(schemas);

  let Client = null;
  let Instance = null;
  let QueryClient = null;
  let ReadOnlyInstance = null;

  const body = [];

  body.push(
    w.importStmt(
      [
        "LCDClient",
        "Coins",
        "Wallet",
        "MsgExecuteContract",
        "TxInfo",
        "WaitTxBroadcastResult",
      ],
      "@terra-money/terra.js"
    ),
    w.importStmt(["ConnectedWallet"], "@terra-money/wallet-provider")
  );

  // TODO: Convert strings to ast.
  body.push(
    t.expressionStatement(
      t.identifier(`function isConnectedWallet(x: Wallet | ConnectedWallet): x is ConnectedWallet {
  return typeof (x as Wallet).key === "undefined";
}`)
    ),
    t.expressionStatement(
      t.identifier(`async function waitForInclusionInBlock(lcd: LCDClient, txHash: string): Promise<TxInfo | undefined> {
  let res;
  for (let i = 0; i <= 50; i++) {
    try {
      res = await lcd.tx.txInfo(txHash);
    } catch (error) {
      // NOOP
    }

    if (res) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return res;
}`)
    )
  );

  // TYPES
  Object.values(typeHash).forEach((type) => {
    body.push(clean(type));
  });

  // query messages
  if (QueryMsg) {
    QueryClient = pascal(`${name}QueryClient`);
    ReadOnlyInstance = pascal(`${name}ReadOnlyInterface`);

    body.push(w.createQueryInterface(contract, ReadOnlyInstance, QueryMsg));
    body.push(w.createQueryClass(contract, QueryClient, ReadOnlyInstance, QueryMsg));
  }

  // execute messages
  if (ExecuteMsg) {
    const children = getMessageProperties(ExecuteMsg);
    if (children.length > 0) {
      Client = pascal(`${name}Client`);
      Instance = pascal(`${name}Interface`);

      body.push(
        w.createExecuteInterface(Instance, ReadOnlyInstance, ExecuteMsg)
      );
      body.push(
        w.createExecuteClass(Client, Instance, QueryClient, ExecuteMsg)
      );
    }
  }

  const code = header + generate(t.program(body)).code;

  mkdirp(outPath);
  writeFileSync(join(outPath, Contract), code);
};
