import path from 'path'
import fs from 'fs'

function fromDir(startPath, filter, callback) {
    if (!fs.existsSync(startPath)) {
        console.log("no dir ", startPath)
        return
    }

    const files = fs.readdirSync(startPath);
    for (const file of files) {
        const filename = path.join(startPath, file)
        const stat = fs.lstatSync(filename)
        if (stat.isDirectory()) {
          fromDir(filename, filter, callback) //recurse
        } else if (filter.test(filename)) callback(filename)
    };
}

const componentFiles = []
fromDir('./src', /\.vue$/, function(info) {
    componentFiles.push(info)
});

export async function getRevisions() {
  const util = require('util');
  const exec = util.promisify(require('child_process').exec);

  const revisions = {}
  for (const componentFile of componentFiles) {
    revisions[componentFile] = await getModifiedInfo(componentFile, exec)
  }
  return revisions
}

async function getModifiedInfo(filePath, exec) {
  const { stdout: savedChanges, stderr: savedError } = await exec(`git diff ${filePath}`)
  if (!!savedChanges) {
    const { stdout: revisionId, stderr: revisionError } = await exec(`git rev-list -1 HEAD -- ${filePath}`)
    return revisionId.replace('\n', '')
  }
  const { stdout: stagedChanges, stderr: stagedError } = await exec(`git diff --staged ${filePath}`)
  if (!!stagedChanges) {
    const { stdout: revisionId, stderr: revisionError } = await exec(`git rev-list -1 HEAD -- ${filePath}`)
    return revisionId.replace('\n', '')
  }
  return null
}

export const version = require('../package.json').version
