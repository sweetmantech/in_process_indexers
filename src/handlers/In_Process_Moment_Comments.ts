import { InProcessERC20Minter, InProcess_Moment_Comments } from "generated";

InProcessERC20Minter.MintComment.handler(async ({ event, context }) => {
  const entity: InProcess_Moment_Comments = {
    id: `${event.params.tokenContract.toLowerCase()}_${Number(event.params.tokenId)}_${event.chainId}_${event.block.number}_${event.logIndex}`,
    sender: event.params.sender.toLowerCase(),
    collection: event.params.tokenContract.toLowerCase(),
    token_id: Number(event.params.tokenId),
    comment: event.params.comment,
    commented_at: event.block.timestamp,
    transaction_hash: event.transaction.hash,
    chain_id: event.chainId,
  };

  context.InProcess_Moment_Comments.set(entity);
});
