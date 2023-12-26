import { promisify } from 'util'
import { exec } from 'child_process'

class Git {
    async addFile(filePath) {
        const { stderr } = await this.exec(`git add ${filePath}`)
        return { error: stderr }
    }

    async isFileTracked(filePath) {
        const { stdout: trackedChanges } = await this.exec(`git ls-files ${filePath}`)
        return !!trackedChanges
    }

    async fileHasChanges(filePath, staged) {  // changes relative to working directory, compared to last commit (HEAD)
        const flags = staged ? '--staged' : ''
        const { stdout: changes } = await this.exec(`git diff ${flags} ${filePath}`)
        return !!changes
    }

    async commitFiles(filePaths, message="File tracking commit", flags=[], ignoreUntracked=false) {
        if (filePaths.length) {
            for (const filePath of filePaths) {
                const { stderr: addErr } = await this.exec(`git add ${filePath}`)
                if (addErr) {
                    throw(addErr)
                }
            }
            const args = [`-m "${message}"`, ...flags]
            try {
                await this.exec(`git commit ${ args.join(' ') }`)
            } catch(commitErr) {
                console.log('COMMIT ERR: ', commitErr)
                if (ignoreUntracked) {
                    const { stdout: rawUntackedFiles } = await this.exec('git status --porcelain | grep "^??"')
                    const untackedFiles = rawUntackedFiles.split('??').map(file => file.trim())
                    untackedFiles.shift()
                    console.log({untackedFiles})
                }
            }
            const commitHash = await this.exec(`git rev-parse HEAD`)
            return commitHash
        }
        return null
    }

    async getFileCommitHash(filePath) { // assumes you're on correct branch
        const { stdout: commitHash } = await this.exec(`git rev-list -1 HEAD -- ${filePath}`)
        return commitHash.trim()
    }

    async fileDiffersFromCommit(filePath, commitHash) {  // changes relative to last commit (HEAD), compared to a specific commit hash
        const { stdout: changes } = await this.exec(`git diff ${commitHash}^..HEAD -- ${filePath}`)
        return !!changes.trim()
    }

    async fileExists(filePath) {
        const { stdout: existingFilePath } = await this.exec(`git ls-files ${filePath}`)
        return !!existingFilePath.trim()
    }

    async branchExists(branchName) {
        try {
            const { stdout: existingBranchName } = await this.exec(`git rev-parse --verify ${branchName}`)
            return !!existingBranchName.trim()
        } catch(err) {
            return false
        }
    }

    async getCurrentBranch() {
        const { stdout: currentBranchName } = await this.exec(`git rev-parse --abbrev-ref HEAD`)
        return currentBranchName.trim()
    }

    async createBranch(branchName) {
        console.log('createBranch', branchName)
        const { stderr: createErr } = await this.exec(`git checkout -b ${branchName}`)
        if (createErr) {
            throw(createErr)
        }
    }

    async checkoutBranch(branchName) {
        console.log('checkoutbranch', branchName)
        try {
            await this.exec(`git checkout ${branchName}`)
        } catch(err) {
            console.log(err)
        }
    }

    async forcefullyCheckoutBranch(branchName) {
        console.log('forcefullyCheckoutBranch', branchName, await this.branchExists(branchName))
        const currentBranch = await this.getCurrentBranch() // hold current branch name
  
        if (!(await this.branchExists(branchName)))
            await this.createBranch(branchName)
        else
            await this.checkoutBranch(branchName)

        return currentBranch
    }

    async checkoutFileFromBranch(filePath, branchName) {
        const { stderr: createErr } = await this.exec(`git checkout ${branchName} -- ${filePath}`)
        if (createErr) {
            throw(createErr)
        }
    }

    async getUserEmail() {
        const { stdout: email } = await this.exec('git config user.email')
        return email.trim()
    }
}

Git.prototype.exec = promisify(exec)
  
export default new Git()
