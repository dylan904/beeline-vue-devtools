import { CosmosClient } from "@azure/cosmos"
import queryViolations from "./queryViolations";
import updateViolations from "./updateViolations";

const a11YCosmosConnectionString = import.meta.env.VITE_A11Y_COSMOS_CONNECTION_STRING

class CosmosSingleton {
  constructor() {
    this.database = null
    this.container = null
  }

  async initialize() {
    if (!this.database || !this.container) {
      if (!a11YCosmosConnectionString) {
        throw new Error('No Cosmos DB connection string provided in env variable: VITE_A11Y_COSMOS_CONNECTION_STRING')
      }

      const client = new CosmosClient(a11YCosmosConnectionString);
      this.database = await client.databases.createIfNotExists({ id: process.env.project }).database
      this.container = await this.database.containers.createIfNotExists({ id: process.env.version })
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
