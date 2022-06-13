import { flags } from '@oclif/command';

export const signer = flags.string({ default: 'test1' });

export const noRebuild = flags.boolean({
  description: 'deploy the wasm bytecode as is.',
  default: false,
});

export const arm64 = flags.boolean({
  description: 'use rust-optimizer-arm64 for optimization. Not recommended for production, but it will optimize quicker on arm64 hardware during development.',
  default: false,
});

export const setSignerAsAdmin = flags.boolean({
  description: 'set signer (deployer) as admin to allow migration.',
  default: false,
});

export const instanceId = flags.string({ default: 'default', description: 'enable management of multiple instances of the same contract' });
