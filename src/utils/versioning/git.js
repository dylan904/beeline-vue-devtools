import { promisify } from 'util'
import { exec } from 'child_process'
import NodeCache from 'node-cache'

const cache = new NodeCache()

class Git {
    async init() {  // optional
        if (!(await this.isRepo())) {
            throw('Not a git repository (yet). Try running "git init"')
        }
        else if (!(await this.hasCommits())) {
            await this.exec('git commit --allow-empty -n -m "Initial commit."')
        }
    }

    async isRepo() {
        const { result } = await this.tryExec(`git rev-parse --is-inside-work-tree`)
        return result.trim() === 'true'
    }

    async isFileTracked(filePath) {
        const { result: trackedChanges } = await this.tryExec(`git ls-files ${filePath}`)
        return !!trackedChanges
    }

    async fileHasChanges(filePath, staged) {  // changes relative to working directory, compared to last commit (HEAD)
        const flags = staged ? '--staged' : ''
        const { result: changes } = await this.tryExec(`git diff ${flags} ${filePath}`)
        return !!changes
    }

    async add(filePath) {
        await this.tryExec(`git add ${filePath}`)
    }

    async getUntrackedFiles() {
        const { result: rawUntrackedFiles } = await this.tryExec('git status --porcelain | grep "^??"')
        const untrackedFiles = rawUntrackedFiles.split('??').map(file => file.trim())
        untrackedFiles.shift()  // last line empty
        return untrackedFiles
    }

    async hasCommits() {
        const { result } = await this.tryExec(`git log`)
        return !!result.trim()
    }

    async commit(message="File tracking commit", flags=[], ignoreUntracked) {
        const args = [`-m "${message}"`, ...flags]
        try {
            await this.exec(`git commit ${ args.join(' ') }`)
        } catch(commitErr) {
            if (ignoreUntracked) {
                const untrackedFiles = await this.getUntrackedFiles()
                console.log({ commitErr, untrackedFiles })
            }
        }
        const { result: commitHash } = await this.tryExec(`git rev-parse HEAD`)
        return commitHash.trim()
    }

    async commitFiles(filePaths, message="File tracking commit", flags=[], ignoreUntracked=false) {
        if (filePaths.length) {
            const fileString = filePaths.map(file => '"' + file + '"').join(' ')
            this.add(fileString)

            return await this.commit(message, flags, ignoreUntracked)
        }
        return null
    }

    async getFileCommitHash(filePath, location="HEAD") { // assumes you're on correct branch
        const { result: commitHash } = await this.tryExec(`git rev-list -1 ${location} -- ${filePath}`)
        return commitHash.trim()
    }

    async fileDiffersFromCommit(filePath, commitHash, compareToHead=false) {  // changes relative to current state or last commit (HEAD), compared to a specific commit hash
        const cmd = compareToHead ? `git diff ${commitHash}..HEAD -- ${filePath}` : `git diff ${commitHash} -- ${filePath}`
        const { result: changes } = await this.tryExec(cmd)
        return !!changes.trim()
    }

    async branchExists(branchName) {
        const { result: existingBranchName } = await this.tryExec(`git rev-parse --verify ${branchName}`)
        return !!existingBranchName.trim()
    }

    async getCurrentBranch() {
        const { result: currentBranchName } = await this.tryExec(`git rev-parse --abbrev-ref HEAD`)
        return currentBranchName.trim()
    }

    async getDefaultBranch() {  // usually 'main' or 'master'
        const { result: defaultBranchName } = await this.tryExec(`git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@'`)
        return defaultBranchName.trim()
    }

    async createBranch(branchName) {
        return await this.tryExec(`git checkout -b ${branchName}`)
    }

    async switchBranch(branchName) {
        return await this.exec(`git switch ${branchName}`)
    }

    async forcefullySwitchBranch(branchName) {
        const currentBranch = await this.getCurrentBranch() // hold current branch name
  
        if (!(await this.branchExists(branchName)))
            await this.createBranch(branchName)
        else
            await this.switchBranch(branchName)

        return currentBranch
    }

    async checkoutFileFromBranch(filePath, branchName) {
        return await this.tryExec(`git checkout ${branchName} -- ${filePath}`)
    }

    async #getStoredStagedFiles() {
        const currentBranch = await this.getCurrentBranch()
        return cache.get(`stagedFiles[${currentBranch}]`)
    }

    async #setStoredStagedFiles() {
        const currentBranch = await this.getCurrentBranch()
        const { result: stagedResult } = await this.tryExec(`git diff --staged --name-only`)
        const stagedFiles = splitLines(stagedResult)
        cache.set(`stagedFiles[${currentBranch}]`, stagedFiles)
    }

    async #restoreStagedChanges() {
        const stagedFiles = await this.#getStoredStagedFiles()
        if (stagedFiles && stagedFiles.length) {
            const fileString = stagedFiles.map(file => '"' + file + '"').join(' ')
            await this.add(fileString)
        }
    }

    async stash() {
        // TODO: find real fix. for now, store staged changes seperately
        this.#setStoredStagedFiles()

        await this.tryExec(`git stash push -m "a11y git.js stash"`)
    }
    
    async applyStash(n=0) {
        await this.tryExec(`git stash apply stash@{${n}}`)
        await this.#restoreStagedChanges()
    }

    async popStash(n=0) {
        await this.tryExec(`git stash pop stash@{${n}}`)
        await this.#restoreStagedChanges()
    }

    async listFiles(flags=[]) {
        const { result } = await this.tryExec(`git ls-files ${ flags.join(' ') }`)
        return splitLines(result)
    }

    async getConfigProp(prop) {
        const { result } = await this.tryExec(`git config ${prop}`)
        return result.trim()
    }

    async tryExec (command) {
        try {
            const { stdout } = await this.exec(command)
            return { result: stdout }
        } catch(error) {
            console.warn(error)
            return { error }
        }
    }
}

Git.prototype.exec = promisify(exec)
  
export default new Git()

function splitLines(text) {
    const output = text.split('\n')
    output.pop()    // last line empty
    return output
}
