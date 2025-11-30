import { InProcessERC20Minter, InProcess_ERC20RewardsDeposit } from "generated";
import getUsdcTransfer from "../../lib/getUsdcTransfer";

InProcessERC20Minter.ERC20RewardsDeposit.handler(async ({ event, context }) => {
  const usdcTransfer = await getUsdcTransfer(event);
  const entity: InProcess_ERC20RewardsDeposit = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    collection: event.params.collection,
    currency: event.params.currency,
    token_id: Number(event.params.tokenId),
    chain_id: event.chainId,
    recipient: usdcTransfer.recipient,
    spender: usdcTransfer.spender,
    amount: usdcTransfer.amount,
    transaction_hash: event.transaction.hash,
    transferred_at: event.block.timestamp,
  };

  context.InProcess_ERC20RewardsDeposit.set(entity);
});
