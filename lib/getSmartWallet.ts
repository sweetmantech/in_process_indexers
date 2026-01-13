import { Address } from "viem";

const getSmartWallet = async (address: Address): Promise<string | undefined> => {
  const MAX_RETRIES = 3;
  const INITIAL_RETRY_DELAY_MS = 1000;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(
        `https://inprocess.world/api/smartwallet?artist_wallet=${address}`
      );
      if (!response.ok) {
        throw new Error(`Failed to get smart wallet: ${response.status} ${response.statusText}`);
      }
      const data: any = await response.json();
      return data.address;
    } catch (error) {
      const isLastAttempt = attempt === MAX_RETRIES;

      if (isLastAttempt) {
        console.warn("Failed to get smart wallet after all retries", address, error);
        return undefined;
      }

      const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt); // Exponential backoff
      console.warn(
        `Failed to get smart wallet (attempt ${attempt + 1}/${MAX_RETRIES + 1}), retrying in ${delay}ms...`,
        address,
        error
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return undefined;
};

export default getSmartWallet;
