import { CosmosClient } from "@azure/cosmos"
import queryViolations from "./queryViolations";
import updateViolations from "./updateViolations";

class CosmosSingleton {
  constructor() {
    this.database = null
    this.container = null
  }

  async initialize() {
    if (!this.database || !this.container) {
      const client = new CosmosClient(import.meta.env.VITE_A11Y_COSMOS_CONNECTION_STRING);
      const { database } = await client.databases.createIfNotExists({ id: process.env.project })
      const { container } = await database.containers.createIfNotExists({ id: process.env.version })
      //const { container } = await database.containers.createIfNotExists({ id: "Violations" })

      this.database = database
      this.container = container
    }
  }

  getDatabase() {
    return this.database
  }

  getContainer() {
    return this.container
  }
}

CosmosSingleton.prototype.queryViolations = queryViolations
CosmosSingleton.prototype.updateViolations = updateViolations

const cosmosSingleton = new CosmosSingleton()
export default cosmosSingleton