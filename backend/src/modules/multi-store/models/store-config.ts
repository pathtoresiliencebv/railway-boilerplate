import { model } from "@medusajs/framework/utils"

export const StoreConfig = model.define("store_config", {
  id: model.id().primaryKey(),
  store_id: model.text(), // Link to core Store module
  subdomain: model.text().unique(),
  custom_domain: model.text().nullable(),
  theme_settings: model.json().nullable(),
  is_active: model.boolean().default(true),
  metadata: model.json().nullable(),
})
