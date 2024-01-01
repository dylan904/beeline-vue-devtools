import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { loadEnv } from 'vite'

import cosmos from './utils/audit/cosmos/index.js' // singleton
import git from './utils/versioning/git.js'  // singleton

import getCosmosViolationOps from './utils/versioning/getCosmosViolationOps.js'
import updateTrackingRepo from './utils/versioning/updateTrackingRepo.js'

const a11yBranch = 'a11y-file-tracking'
console.log('hii2')

export async function getPackageJSON(importURL) {
  try {
    console.log({importURL})
    const __dirname = dirname(fileURLToPath(importURL))
    const resolvedPackagePath = resolve(__dirname, './package.json')
    console.log({resolvedPackagePath})
    const packageModule = await import(resolvedPackagePath, {
      assert: { type: 'json' }
    })
    return packageModule.default
  }
  catch(err) {
    console.log(err)
  }
}

export async function getA11yConfig(importURL) {

  console.log('testrepo2', (await git.hasCommits()), dirname(fileURLToPath(importURL)), await git.isRepo())
  
  try {
    await git.init()
  } catch(err) {
    console.log(err)
    return {}
  }

  process.env = { ...process.env, ...loadEnv(process.env.NODE_ENV, process.cwd()) }
  
  const packageJSON = await getPackageJSON(importURL)
  console.log({packageJSON})
  const newProcessProps = {
    'process.env.project': '"' + packageJSON.name + '"',
    'process.env.version': '"' + packageJSON.version + '"',
    'process.env.author': '"' + await git.getUserEmail() + '"',
    'process.env.AUDITA11Y': process.env.AUDITA11Y || '""',
    'process.env.VITE_A11Y_COSMOS_CONNECTION_STRING': '"' + process.env.VITE_A11Y_COSMOS_CONNECTION_STRING + '"'
  }

  for (const propKey in newProcessProps) {
    const value = newProcessProps[propKey]
    process.env[propKey.replace('process.env.', '')] = value.substring(1, value.length-1)
  }

  // set revisions after so it can access cosmos string
  const revisions = await getRevisions(packageJSON.name, packageJSON.version)
  newProcessProps['process.env.revisions'] = revisions
  process.env.revisions = revisions

  return newProcessProps
}

async function getRevisions(packageName, packageVersion) {
  try {
    if (!cosmos.getContainer()) {
      console.log('initfromrev')
      await cosmos.init(packageName, packageVersion)
    }
  } catch(err) {
    console.warn('Cant get revisions: ' + err)
    return {}
  }
  const currentBranch = await git.forcefullyCheckoutBranch(a11yBranch)

  try {
    const revisions = await updateTrackingRepo()

    setTimeout(() => findAndUpdatePendingOps.call(this, currentBranch))

    return revisions
  }
  catch (err) {
    console.warn(err)
    git.checkoutBranch(currentBranch)
  }
}

export function revisionWatcherVitePlugin() {
  return {
    name: 'beeline-revision-watcher',
    enforce: 'post',
    async handleHotUpdate({ file, server, modules }) {
      console.log('reloading revisions...', file.endsWith('.vue'), {file, modules});
      if (file.endsWith('.vue')) {
        server.ws.send({
          type: 'custom',
          event: 'revisions-update',
          data: await getRevisions()
        })
      }
    }
  }
}

function joinArraysByProp(array1, array1name, array2, array2name, prop=id) {
  const propSet = new Set([...array1.map(obj => obj[prop]), ...array2.map(obj => obj[prop])])

  return Array.from(propSet).map(propValue => {
    const obj1 = array1.find(obj => obj[prop] === propValue)
    const obj2 = array2.find(obj => obj[prop] === propValue)
    const output = {}
    if (obj1)
      output[array1name] = { ...obj1 }
    if (obj2)
      output[array2name] = { ...obj2 }
    return output
  })
}

async function findAndUpdatePendingOps(currentBranch) {
  const currentOps = []
  const pendingOps = []
  
  const qResultsCurrent = await cosmos.queryViolations(null, false)
  const qResultsPending = await cosmos.queryViolations(null, true)
  const syncedPageViolationSet = joinArraysByProp(qResultsCurrent, 'current', qResultsPending, 'pending', 'urlKey')

  console.log({qResultsCurrent, qResultsPending})

  for (const syncedPageViolations of syncedPageViolationSet) {
    const pendingViolations = syncedPageViolations.pending?.violations || []
    const currentViolations = syncedPageViolations.current?.violations || []
    console.log('loop', {pendingViolations, currentViolations})

    const opsFromPending = await getCosmosViolationOps(pendingViolations, currentViolations, true)
    const opsFromCurrent = await getCosmosViolationOps(currentViolations, pendingViolations, false)

    pendingOps.push( ...opsFromPending.pending, ...opsFromCurrent.pending )
    currentOps.push( ...opsFromPending.current, ...opsFromCurrent.pending )
  }
  console.log({syncedPageViolationSet})
  console.log({pendingOps, currentOps})
  console.log({currentBranch})

  git.checkoutBranch(currentBranch)    // return to previous branch

  if (pendingOps.length) {
    //await cosmos.updateViolations(qResultPending.id, pendingOps, true)
  }
  if (currentOps.length) {
    //await cosmos.updateViolations(qResultCurrent.id, currentOps)
  }
}
