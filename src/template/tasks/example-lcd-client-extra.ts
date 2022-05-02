import { Env, task } from "@terra-money/terrain";

task(async (env: Env) => {
  const { client, wallets } = env;
  
  // query is a thin wrapper of contract query
  const count = await client.query("counter", { get_count: {} });
  console.log("prev count = ", count);

  // execute is a thin wrapper of signing and broadcasting execute contract
  await client.execute(wallets.validator, "counter", {
    increment: {},
  });
  const count2 = await client.query("counter", { get_count: {} });
  console.log("new count = ", count2);
});
