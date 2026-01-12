import getEntity from "@/lib/in_process_airdrops/getEntity";
import { InProcessMoment } from "generated";
import { zeroAddress } from "viem";

InProcessMoment.TransferSingle.handler(
  async ({ event, context }) => {
    const entity = await getEntity(event, context);
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
