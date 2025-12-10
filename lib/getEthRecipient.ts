import { Address, Hash, toHex, zeroAddress } from "viem";
import { InProcessMoment_Purchased_event } from "generated";
import getTransactionReceipt from "./viem/getTransactionReceipt";

const getEthRecipient = async (event: InProcessMoment_Purchased_event): Promise<Address> => {
  try {
    const receipt = await getTransactionReceipt(event.transaction.hash as Hash, event.chainId);

    // Convert event.value to hex format (padded to 64 characters for uint256)
    const eventValueHex = toHex(event.params.value, { size: 32 });

    // Filter logs where data hex equals event.value
    const matchingLogs = receipt.logs.filter((log) => {
      // Compare hex values (both should have '0x' prefix)
      return log.data.toLowerCase() === eventValueHex.toLowerCase();
    });

    if (matchingLogs.length === 0) return zeroAddress;

    return matchingLogs[0].address;
  } catch (err) {
    console.warn("Failed to fetch/parse logs for tx", event.transaction.hash, err);
    return zeroAddress;
  }
};

export default getEthRecipient;
