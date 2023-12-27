import { CosmosClient } from '@azure/cosmos'
import queryViolations from './queryViolations'
import updateViolations from './updateViolations'
import 'dotenv/config'

const a11YCosmosConnectionString = import.meta.env ? import.meta.env.VITE_A11Y_COSMOS_CONNECTION_STRING : process.env.VITE_A11Y_COSMOS_CONNECTION_STRING

class CosmosSingleton {
  constructor() {
    this.database = null
    this.container = null
  }

  async init() {
    if (!this.database || !this.container) {
      if (!a11YCosmosConnectionString) {
        throw new Error('No Cosmos DB connection string provided in env variable: VITE_A11Y_COSMOS_CONNECTION_STRING')
      }

      const client = new CosmosClient(a11YCosmosConnectionString);
      console.log('test', {cosmosString: a11YCosmosConnectionString, project: process.env.project, version: process.env.version})
      const { database } = await client.databases.createIfNotExists({ id: process.env.project })
      this.database = database
      
      const { container } = await this.database.containers.createIfNotExists({ id: process.env.version })
      this.container = container
      
      const { container: modifiedContainer } = await this.database.containers.createIfNotExists({ id: `${process.env.version} (pending)` })
      this.modifiedContainer = modifiedContainer
    }
  }

  getContainer(modified) {
    return modified ? this.modifiedContainer : this.container
  }

  getContainers() {
    return { 
      container: this.container, 
      modifiedContainer: this.modifiedContainer 
    }
  }
}

CosmosSingleton.prototype.queryViolations = queryViolations
CosmosSingleton.prototype.updateViolations = updateViolations

const cosmosSingleton = new CosmosSingleton()
export default cosmosSingleton
