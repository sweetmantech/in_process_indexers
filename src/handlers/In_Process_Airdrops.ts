import getCollectionEntity from "@/lib/in_process_collections/getEntity";
import getAirdropEntity from "@/lib/in_process_airdrops/getEntity";
import { InProcessMoment } from "generated";
import { Address, zeroAddress } from "viem";
import getSmartWallet from "@/lib/getSmartWallet";

InProcessMoment.TransferSingle.handler(
  async ({ event, context }) => {
    const collection = await getCollectionEntity(event, context);
    if (!collection) {
      return;
    }
    const defaultAdmin = collection.default_admin;
    const smartwallet = await getSmartWallet(defaultAdmin as Address);
    const operator = event.params.operator.toLowerCase();
    if (operator !== defaultAdmin && operator !== smartwallet) return;
    const entity = await getAirdropEntity(event, context);
    context.InProcess_Airdrops.set(entity);
  },
  {
    eventFilters: [
      {
        from: zeroAddress,
      },
    ],
  }
);
