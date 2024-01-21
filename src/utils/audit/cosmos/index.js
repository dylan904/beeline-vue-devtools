import { CosmosClient } from '@azure/cosmos'
import queryViolations from './queryViolations.js'
import updateViolations from './updateViolations.js'

class CosmosSingleton {
  constructor() {
    this.database = null
    this.container = null
  }

  async init(packageName, packageVersion) {
    try {
      if (this.getContainer())
        return true
      
      if (!this.database || !this.container) {
        const env = import.meta.env || process.env
        const { VITE_A11Y_COSMOS_CONNECTION_STRING: cosmosConnectionString } = env
        if (!cosmosConnectionString) {
          throw new Error('No Cosmos DB connection string provided in env variable: VITE_A11Y_COSMOS_CONNECTION_STRING')
        }

        const thePackage = {
          name: packageName || env.project,
          version: packageVersion || env.version
        }

        if (!thePackage.name || !thePackage.version)
          console.warn('no package name/version for cosmos instance', {thePackage, 'import.meta.env': import.meta.env, 'process.env': process.env})

        const client = new CosmosClient(cosmosConnectionString);
        console.log('testmepls', {cosmosString: cosmosConnectionString, thePackage})
        const { database } = await client.databases.createIfNotExists({ id: thePackage.name })
        this.database = database
        
        const { container } = await this.database.containers.createIfNotExists({ id: thePackage.version })
        this.container = container
        
        const { container: modifiedContainer } = await this.database.containers.createIfNotExists({ id: `${thePackage.version} (pending)` })
        this.modifiedContainer = modifiedContainer
        return true
      }
    } catch (err) {
      console.warn('Cant init cosmos: ' + err)
      return false
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
