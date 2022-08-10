export default (network: string | undefined) => {
  if (network === 'mainnet') {
    return false;
  }

  return process.arch === 'arm64';
};
