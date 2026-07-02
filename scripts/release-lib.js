#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { spawnSync } = require('child_process');

function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) {
    return null;
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function bumpVersion(currentVersion, bumpType) {
  const parts = parseVersion(currentVersion);
  if (!parts) {
    throw new Error(`Invalid version: ${currentVersion}`);
  }

  switch (bumpType) {
    case 'patch':
      return `${parts.major}.${parts.minor}.${parts.patch + 1}`;
    case 'minor':
      return `${parts.major}.${parts.minor + 1}.0`;
    case 'major':
      return `${parts.major + 1}.0.0`;
    default:
      throw new Error(`Unknown bump type: ${bumpType}`);
  }
}

function createReleaseRunner(config) {
  const INTERNAL_ROOT = path.resolve(config.internalRoot || path.join(__dirname, '..'));
  const PUBLIC_REPO_URL = process.env[config.publicRepoUrlEnv] || config.publicRepoUrl;
  const DEFAULT_PUBLIC_REPO_PATH = path.resolve(
    INTERNAL_ROOT,
    config.defaultPublicRepoRelative
  );
  const PUBLIC_REPO_PATH = path.resolve(
    process.env[config.publicRepoPathEnv] || DEFAULT_PUBLIC_REPO_PATH
  );
  const PUBLIC_BRANCH = config.publicBranch || 'master';
  const INTERNAL_COMMIT_PREFIX = config.internalCommitPrefix || 'chore: release v';
  const PUBLIC_COMMIT_MESSAGE =
    config.publicCommitMessage || ((version) => `v${version}`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  function prompt(question) {
    return new Promise((resolve) => {
      rl.question(question, (answer) => resolve(answer.trim()));
    });
  }

  async function confirm(question, defaultYes = false) {
    const suffix = defaultYes ? ' [Y/n] ' : ' [y/N] ';
    const answer = (await prompt(`${question}${suffix}`)).toLowerCase();
    if (!answer) {
      return defaultYes;
    }
    return answer === 'y' || answer === 'yes';
  }

  function run(command, args, options = {}) {
    const result = spawnSync(command, args, {
      cwd: options.cwd || INTERNAL_ROOT,
      stdio: options.stdio || 'inherit',
      encoding: 'utf-8',
      env: process.env,
    });

    if (result.status !== 0) {
      throw new Error(
        options.errorMessage ||
          `Command failed: ${command} ${args.join(' ')} (exit ${result.status})`
      );
    }

    return result;
  }

  function runGit(args, options = {}) {
    return run('git', args, options);
  }

  function isGitRepo(dir) {
    return fs.existsSync(path.join(dir, '.git'));
  }

  function assertCleanWorkingTree(repoPath, label) {
    const result = spawnSync('git', ['status', '--porcelain'], {
      cwd: repoPath,
      encoding: 'utf-8',
    });

    if (result.status !== 0) {
      throw new Error(`Unable to read git status for ${label}`);
    }

    if (result.stdout.trim()) {
      throw new Error(
        `${label} has uncommitted changes. Commit or stash them before releasing.`
      );
    }
  }

  function getCurrentBranch(repoPath) {
    const result = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd: repoPath,
      encoding: 'utf-8',
    });

    if (result.status !== 0) {
      throw new Error(`Unable to determine current branch in ${repoPath}`);
    }

    return result.stdout.trim();
  }

  function ensurePublicRepo() {
    if (isGitRepo(PUBLIC_REPO_PATH)) {
      console.log(`\nUsing existing public repo at ${PUBLIC_REPO_PATH}`);
      runGit(['fetch', 'origin'], { cwd: PUBLIC_REPO_PATH });

      const currentBranch = getCurrentBranch(PUBLIC_REPO_PATH);
      if (currentBranch !== PUBLIC_BRANCH) {
        console.log(`Checking out ${PUBLIC_BRANCH} in public repo...`);
        runGit(['checkout', PUBLIC_BRANCH], { cwd: PUBLIC_REPO_PATH });
      }

      runGit(['pull', '--ff-only', 'origin', PUBLIC_BRANCH], {
        cwd: PUBLIC_REPO_PATH,
      });
      return;
    }

    if (fs.existsSync(PUBLIC_REPO_PATH)) {
      throw new Error(
        `${PUBLIC_REPO_PATH} exists but is not a git repository. Remove it or set ${config.publicRepoPathEnv}.`
      );
    }

    console.log(`\nCloning public repo into ${PUBLIC_REPO_PATH}...`);
    fs.mkdirSync(path.dirname(PUBLIC_REPO_PATH), { recursive: true });
    run('git', ['clone', PUBLIC_REPO_URL, PUBLIC_REPO_PATH]);
  }

  function syncToPublicRepo() {
    const excludeArgs = config.rsyncExcludes.flatMap((pattern) => [
      '--exclude',
      pattern,
    ]);

    console.log('\nSyncing files from internal repo to public repo...');
    run(
      'rsync',
      [
        '-a',
        '--delete',
        ...excludeArgs,
        `${INTERNAL_ROOT}/`,
        `${PUBLIC_REPO_PATH}/`,
      ],
      {
        errorMessage:
          'rsync failed. Ensure rsync is installed and both repo paths are accessible.',
      }
    );
  }

  async function chooseVersion(currentVersion) {
    console.log(`\nCurrent version: ${currentVersion}`);
    console.log('\nSelect a version bump:');
    console.log(`  1) patch  -> ${bumpVersion(currentVersion, 'patch')}`);
    console.log(`  2) minor  -> ${bumpVersion(currentVersion, 'minor')}`);
    console.log(`  3) major  -> ${bumpVersion(currentVersion, 'major')}`);
    console.log('  4) custom version');

    const choice = await prompt('\nEnter choice [1-4]: ');

    switch (choice) {
      case '1':
      case 'patch':
        return bumpVersion(currentVersion, 'patch');
      case '2':
      case 'minor':
        return bumpVersion(currentVersion, 'minor');
      case '3':
      case 'major':
        return bumpVersion(currentVersion, 'major');
      case '4':
      case 'custom': {
        const customVersion = await prompt('Enter new version (e.g. 1.2.4): ');
        if (!parseVersion(customVersion)) {
          throw new Error(`Invalid version format: ${customVersion}`);
        }
        return customVersion;
      }
      default:
        throw new Error(`Invalid choice: ${choice}`);
    }
  }

  function printSummary(newVersion) {
    console.log('\nRelease plan:');
    console.log(`  Internal repo: ${INTERNAL_ROOT}`);
    console.log(`  Public repo:   ${PUBLIC_REPO_PATH}`);
    console.log(`  New version:   ${newVersion}`);
    console.log('\nSteps:');
    config.printReleaseSteps(newVersion).forEach((step, index) => {
      console.log(`  ${index + 1}. ${step}`);
    });
  }

  async function commitInternalVersionBump(newVersion) {
    const files = config.getVersionFilesToStage
      ? config.getVersionFilesToStage(newVersion)
      : [];

    const existingFiles = files.filter((file) =>
      fs.existsSync(path.join(INTERNAL_ROOT, file))
    );

    if (existingFiles.length > 0) {
      runGit(['add', ...existingFiles]);
    } else {
      runGit(['add', '-A']);
    }

    runGit(['commit', '-m', `${INTERNAL_COMMIT_PREFIX}${newVersion}`]);
  }

  async function commitPublicRepo(newVersion) {
    runGit(['add', '-A'], { cwd: PUBLIC_REPO_PATH });
    const publicStatus = spawnSync('git', ['status', '--porcelain'], {
      cwd: PUBLIC_REPO_PATH,
      encoding: 'utf-8',
    });

    if (!publicStatus.stdout.trim()) {
      console.log('No changes to commit in public repo.');
      return;
    }

    const message =
      typeof PUBLIC_COMMIT_MESSAGE === 'function'
        ? PUBLIC_COMMIT_MESSAGE(newVersion)
        : PUBLIC_COMMIT_MESSAGE;

    runGit(['commit', '-m', message], { cwd: PUBLIC_REPO_PATH });
  }

  async function tagPublicRepo(newVersion) {
    if (!config.tagPublicRelease) {
      return;
    }

    const tagName = config.publicTagName
      ? config.publicTagName(newVersion)
      : newVersion;

    const existingTag = spawnSync('git', ['rev-parse', tagName], {
      cwd: PUBLIC_REPO_PATH,
      encoding: 'utf-8',
    });

    if (existingTag.status === 0) {
      throw new Error(`Tag ${tagName} already exists in the public repo.`);
    }

    runGit(['tag', tagName], { cwd: PUBLIC_REPO_PATH });
    console.log(`\nCreated tag ${tagName} in public repo.`);
  }

  async function pushPublicRepo(newVersion) {
    console.log('\nPushing public repo...');
    runGit(['push', 'origin', PUBLIC_BRANCH], { cwd: PUBLIC_REPO_PATH });

    if (config.tagPublicRelease) {
      const tagName = config.publicTagName
        ? config.publicTagName(newVersion)
        : newVersion;
      runGit(['push', 'origin', tagName], { cwd: PUBLIC_REPO_PATH });
    }
  }

  async function main() {
    console.log(config.projectTitle);
    console.log('='.repeat(config.projectTitle.length));

    if (!isGitRepo(INTERNAL_ROOT)) {
      throw new Error('This script must be run from the internal git repository.');
    }

    const currentVersion = config.readVersion(INTERNAL_ROOT);
    const newVersion = await chooseVersion(currentVersion);
    printSummary(newVersion);

    if (!(await confirm('\nProceed with release?', false))) {
      console.log('Release cancelled.');
      return;
    }

    assertCleanWorkingTree(INTERNAL_ROOT, 'Internal repo');

    if (config.preReleaseChecks) {
      console.log('\n[1] Running pre-release checks...');
      await config.preReleaseChecks({ run, internalRoot: INTERNAL_ROOT });
    }

    console.log('\n[2] Bumping version in internal repo...');
    config.writeVersion(INTERNAL_ROOT, newVersion);

    if (config.afterVersionBump) {
      await config.afterVersionBump({
        run,
        internalRoot: INTERNAL_ROOT,
        version: newVersion,
      });
    }

    await commitInternalVersionBump(newVersion);

    if (await confirm('\nPush internal repo to GitHub?', true)) {
      const internalBranch = getCurrentBranch(INTERNAL_ROOT);
      console.log(`\nPushing internal repo (${internalBranch})...`);
      runGit(['push', 'origin', internalBranch]);
    }

    console.log('\n[3] Preparing public repo...');
    ensurePublicRepo();
    assertCleanWorkingTree(PUBLIC_REPO_PATH, 'Public repo');

    console.log('\n[4] Syncing files to public repo...');
    syncToPublicRepo();

    if (config.afterSync) {
      console.log('\n[5] Post-sync transformations...');
      await config.afterSync({
        publicRepoPath: PUBLIC_REPO_PATH,
        internalRoot: INTERNAL_ROOT,
        version: newVersion,
      });
    }

    console.log(`\n[${config.afterSync ? '6' : '5'}] Committing public repo...`);
    await commitPublicRepo(newVersion);

    if (config.tagPublicRelease) {
      await tagPublicRepo(newVersion);
    }

    if (await confirm('\nPush public repo to GitHub?', true)) {
      await pushPublicRepo(newVersion);
    }

    if (config.publish) {
      const publishLabel = config.publishLabel || 'Publish release';
      if (await confirm(`\n${publishLabel} now?`, true)) {
        await config.publish({
          run,
          publicRepoPath: PUBLIC_REPO_PATH,
          internalRoot: INTERNAL_ROOT,
          version: newVersion,
        });
      } else if (config.publishManualHint) {
        console.log(`\nSkipped publish step.`);
        console.log(config.publishManualHint(newVersion, PUBLIC_REPO_PATH));
      }
    }

    console.log('\nRelease complete.');

    if (config.onComplete) {
      config.onComplete({
        publicRepoPath: PUBLIC_REPO_PATH,
        internalRoot: INTERNAL_ROOT,
        version: newVersion,
      });
    }
  }

  return {
    run: () =>
      main()
        .catch((error) => {
          console.error(`\nRelease failed: ${error.message}`);
          process.exitCode = 1;
        })
        .finally(() => {
          rl.close();
        }),
  };
}

module.exports = { createReleaseRunner, parseVersion, bumpVersion };
