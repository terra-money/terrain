import { Command, flags } from "@oclif/command";
import * as YAML from "yaml";
import { LCDClient, MsgUpdateContractAdmin } from "@terra-money/terra.js";
import { cli } from "cli-ux";
import { loadConnections, loadRefs } from "../../config";
import { getSigner } from "../../lib/signer";
import { waitForInclusionInBlock } from '../../lib/waitForInclusionBlock';


export default class ContractUpdateAdmin extends Command {
  static description = "Update the admin of a contract.";

  static flags = {
    network: flags.string({ default: "localterra" }),
    "config-path": flags.string({ default: "./config.terrain.json" }),
    "refs-path": flags.string({ default: "./refs.terrain.json" }),
    "keys-path": flags.string({ default: "./keys.terrain.js" }),
    "instance-id": flags.string({ default: "default" }),
    signer: flags.string({ required: true }),
  };

  static args = [
    { name: "contract", required: true },
    { name: "admin", required: true },
  ];

  async run() {
    const { args, flags } = this.parse(ContractUpdateAdmin);

    const connections = loadConnections(flags["config-path"]);
    const refs = loadRefs(flags["refs-path"]);
    const network = flags.network;
    const lcd = new LCDClient(connections(flags.network));
    const signer = getSigner({
      network: flags.network,
      signerId: flags.signer,
      keysPath: flags["keys-path"],
      lcd,
    });

    const contractAddress = refs[network][args.contract].contractAddresses[flags['instance-id']];

    cli.action.start(
      `updating contract admin to: ${args.admin}`
    );

    const updateAdminTx = await signer.createAndSignTx({
      msgs: [
        new MsgUpdateContractAdmin(
          signer.key.accAddress,
          args.admin,
          contractAddress
        ),
      ],
    });

    const result = await lcd.tx.broadcastSync(updateAdminTx);
    const res = await waitForInclusionInBlock(lcd, result.txhash);

    cli.action.stop();

    cli.log(YAML.stringify(JSON.parse(res.raw_log)));
  }
}
