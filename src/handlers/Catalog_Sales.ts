import {
  USDCFixedPriceController,
  type USDCFixedPriceController_MintConfigurationUpdated_handlerArgs,
} from "generated";
import getLatestSale from "@/lib/catalog_sales/getLatestSale";

USDCFixedPriceController.MintConfigurationUpdated.handler(
  async ({ event, context }: USDCFixedPriceController_MintConfigurationUpdated_handlerArgs) => {
    const latestSale = await getLatestSale(event, context);
    context.Catalog_Sales.set(latestSale);
  }
);
