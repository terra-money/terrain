import { Env, task } from "@terra-money/terrain";

task(async (env:Env) => {
  console.log(env);
  console.log("Template")
});
