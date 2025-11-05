import { Hash } from "viem";
import { baseClient } from "./client";

const getTransactionReceipt = async (hash: Hash) => {
  const receipt = await baseClient.getTransactionReceipt({
    hash,
  });
  return receipt;
};

export default getTransactionReceipt;
