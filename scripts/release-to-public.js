#!/usr/bin/env node
'use strict';

/**
 * Interactive release script for publishing vibes-react-native-expo from the
 * internal development repo to the public GitHub repo and npm.
 *
 * Usage:
 *   node scripts/release-to-public.js
 *   npm run release:public
 *
 * Environment variables:
 *   VIBES_PUBLIC_REPO_PATH - local path to the public repo (default: ../vibes-react-native-expo)
 *   VIBES_PUBLIC_REPO_URL  - git URL used when cloning the public repo
 */

const fs = require('fs');
const path = require('path');
const { createReleaseRunner } = require('./release-lib');

const COMMON_RSYNC_EXCLUDES = [
  '.git',
  'node_modules',
  '.DS_Store',
  '.vscode',
  '.env',
  '.envrc',
  '**/google-services.json',
];

function readPackageVersion(packageJsonPath) {
  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')).version;
}

function writePackageVersion(packageJsonPath, version) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  packageJson.version = version;
  fs.writeFileSync(
    packageJsonPath,
    `${JSON.stringify(packageJson, null, 2)}\n`
  );
}

function updateLockfileVersion(lockfilePath, newVersion) {
  if (!fs.existsSync(lockfilePath)) {
    return;
  }

  const lockfile = JSON.parse(fs.readFileSync(lockfilePath, 'utf-8'));
  if (lockfile.version) {
    lockfile.version = newVersion;
  }
  if (lockfile.packages && lockfile.packages['']) {
    lockfile.packages[''].version = newVersion;
  }
  fs.writeFileSync(lockfilePath, `${JSON.stringify(lockfile, null, 2)}\n`);
}

createReleaseRunner({
  projectTitle: 'Vibes React Native Expo - Release to Public',
  publicRepoUrl: 'https://github.com/vibes/vibes-react-native-expo.git',
  publicRepoUrlEnv: 'VIBES_PUBLIC_REPO_URL',
  publicRepoPathEnv: 'VIBES_PUBLIC_REPO_PATH',
  defaultPublicRepoRelative: '../vibes-react-native-expo',
  rsyncExcludes: [
    ...COMMON_RSYNC_EXCLUDES,
    'build',
    'plugin/build',
    'example/node_modules',
    'example/ios/Pods',
    'example/vendor',
    'example/android/build',
    'example/ios/build',
    'example/android/libs',
    'android/build',
    'ios/build',
    '.expo',
    'example/.env',
    'plugin/tsconfig.tsbuildinfo',
    'xcuserdata',
    'DerivedData',
  ],
  readVersion: (internalRoot) =>
    readPackageVersion(path.join(internalRoot, 'package.json')),
  writeVersion: (internalRoot, version) => {
    writePackageVersion(path.join(internalRoot, 'package.json'), version);
    updateLockfileVersion(path.join(internalRoot, 'package-lock.json'), version);
  },
  afterVersionBump: async ({ run, internalRoot }) => {
    run('npm', ['run', 'prepare'], { cwd: internalRoot });
  },
  afterSync: async ({ publicRepoPath }) => {
    const { spawnSync } = require('child_process');

    for (const dir of ['build', 'plugin/build']) {
      const fullPath = path.join(publicRepoPath, dir);
      if (fs.existsSync(fullPath)) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      }
    }

    spawnSync(
      'git',
      ['rm', '-r', '--cached', '--ignore-unmatch', 'build', 'plugin/build'],
      { cwd: publicRepoPath, stdio: 'inherit' }
    );
  },
  getVersionFilesToStage: () => ['package.json', 'package-lock.json'],
  preReleaseChecks: async ({ run, internalRoot }) => {
    run('npm', ['run', 'lint'], { cwd: internalRoot });
    run('npm', ['run', 'prepare'], { cwd: internalRoot });
  },
  printReleaseSteps: (version) => [
    'Run lint and prepare checks (npm run lint, npm run prepare)',
    'Bump version and commit to internal repo',
    'Sync source files to public repo (excludes build/; npm publish builds it)',
    'Remove any tracked build/ artifacts from the public repo',
    `Commit public repo as "v${version}"`,
    'Optionally push public repo to GitHub',
    'Optionally publish to npm from public repo (runs npm ci, then npm publish)',
  ],
  publishLabel: 'Publish to npm',
  publish: async ({ run, publicRepoPath, version }) => {
    const { spawnSync } = require('child_process');
    console.log('\nInstalling dependencies in public repo...');
    run('npm', ['ci'], { cwd: publicRepoPath });

    console.log('\nPublishing to npm from public repo...');
    console.log('You may be prompted to log in if your npm session has expired.');

    const whoami = spawnSync('npm', ['whoami'], {
      cwd: publicRepoPath,
      encoding: 'utf-8',
    });

    if (whoami.status !== 0) {
      console.log('\nNot logged in to npm. Starting npm login...');
      run('npm', ['login'], { cwd: publicRepoPath });
    } else {
      console.log(`\nLogged in to npm as ${whoami.stdout.trim()}`);
    }

    run('npm', ['publish'], { cwd: publicRepoPath });
    console.log(`\nPublished vibes-react-native-expo@${version} to npm.`);
  },
  publishManualHint: (_version, publicRepoPath) =>
    `To publish manually:\n  cd ${publicRepoPath}\n  npm ci\n  npm login\n  npm publish`,
}).run();
