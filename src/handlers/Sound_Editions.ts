import {
  SoundCreatorV2,
  SoundEditionV2_1,
  type Sound_Editions,
  type SoundCreatorV2_Created_handlerArgs,
  type SoundEditionV2_1_SoundEditionInitialized_handlerArgs,
  type contractRegistrations,
} from "generated";

SoundCreatorV2.Created.contractRegister(
  ({
    event,
    context,
  }: {
    event: { params: { edition: string } };
    context: contractRegistrations;
  }) => {
    context.addSoundEditionV2_1(event.params.edition);
  }
);

SoundCreatorV2.Created.handler(async ({ event, context }: SoundCreatorV2_Created_handlerArgs) => {
  const address = event.params.edition.toLowerCase();
  const entity: Sound_Editions = {
    id: `${address}_${event.chainId}`,
    address,
    name: "",
    owner: event.params.owner.toLowerCase(),
    uri: "",
    chain_id: event.chainId,
    created_at: event.block.timestamp,
    updated_at: event.block.timestamp,
    transaction_hash: event.transaction.hash,
  };
  context.Sound_Editions.set(entity);
});

SoundEditionV2_1.SoundEditionInitialized.handler(
  async ({ event, context }: SoundEditionV2_1_SoundEditionInitialized_handlerArgs) => {
    const address = event.srcAddress.toLowerCase();
    // init tuple: [name, symbol, metadataModule, baseURI, contractURI, ...]
    const init = event.params.init;
    const [name, , , , contractURI] = init;

    const existing = await context.Sound_Editions.get(`${address}_${event.chainId}`);

    context.Sound_Editions.set({
      id: `${address}_${event.chainId}`,
      address,
      name: name as string,
      owner: existing?.owner ?? "",
      uri: contractURI as string,
      chain_id: event.chainId,
      created_at: existing?.created_at ?? event.block.timestamp,
      updated_at: event.block.timestamp,
      transaction_hash: event.transaction.hash,
    });
  }
);
