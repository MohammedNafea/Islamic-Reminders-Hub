const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const GITHUB_TOKEN = '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';
const GIT_PATH = '"C:\\Program Files\\Git\\cmd\\git.exe"';

async function run() {
  console.log('Fetching user details from GitHub...');
  const userRes = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'Node-Fetch'
    }
  });

  if (!userRes.ok) {
    const errorText = await userRes.text();
    throw new Error(`Failed to fetch user details: ${userRes.statusText}. ${errorText}`);
  }

  const userData = await userRes.json();
  const username = userData.login;
  console.log(`Authenticated as GitHub user: ${username}`);

  const repoName = 'Islamic-Reminders-Hub';
  console.log(`Checking if repository ${repoName} exists on GitHub...`);

  const repoCheckRes = await fetch(`https://api.github.com/repos/${username}/${repoName}`, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'Node-Fetch'
    }
  });

  if (repoCheckRes.status === 404) {
    console.log(`Repository does not exist. Creating private repository ${repoName}...`);
    const createRes = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Node-Fetch'
      },
      body: JSON.stringify({
        name: repoName,
        private: true,
        description: 'Islamic Reminders Hub - Private Repository'
      })
    });

    if (!createRes.ok) {
      const errorText = await createRes.text();
      throw new Error(`Failed to create repository: ${createRes.statusText}. ${errorText}`);
    }
    console.log(`Successfully created private repository: ${repoName}`);
  } else if (repoCheckRes.ok) {
    console.log(`Repository ${repoName} already exists.`);
  } else {
    const errorText = await repoCheckRes.text();
    throw new Error(`Failed to check repository: ${repoCheckRes.statusText}. ${errorText}`);
  }

  // Setup Git remote and push
  console.log('Configuring local Git repository...');
  
  // Set user email and name if not set
  try {
    execSync(`${GIT_PATH} config user.email "king.darkmn.@gmail.com"`, { stdio: 'inherit' });
    execSync(`${GIT_PATH} config user.name "${username}"`, { stdio: 'inherit' });
  } catch (err) {
    console.warn('Failed to set Git config email/name, continuing...', err.message);
  }

  // Check if remote origin already exists
  let hasOrigin = false;
  try {
    const remotes = execSync(`${GIT_PATH} remote`, { encoding: 'utf8' });
    if (remotes.includes('origin')) {
      hasOrigin = true;
    }
  } catch (e) {}

  const remoteUrl = `https://${username}:${GITHUB_TOKEN}@github.com/${username}/${repoName}.git`;
  if (hasOrigin) {
    console.log('Updating existing git remote origin...');
    execSync(`${GIT_PATH} remote set-url origin "${remoteUrl}"`, { stdio: 'inherit' });
  } else {
    console.log('Adding new git remote origin...');
    execSync(`${GIT_PATH} remote add origin "${remoteUrl}"`, { stdio: 'inherit' });
  }

  // Add all files and commit
  console.log('Adding files and committing changes...');
  execSync(`${GIT_PATH} add -A`, { stdio: 'inherit' });
  
  try {
    execSync(`${GIT_PATH} commit -m "Configure Supabase and Cloudflare integration with split cards"`, { stdio: 'inherit' });
  } catch (commitErr) {
    console.log('No new changes to commit or commit failed (might be clean). Continuing to push...');
  }

  // Push main branch
  console.log('Pushing to GitHub...');
  // Check active branch name
  let branchName = 'main';
  try {
    const branchInfo = execSync(`${GIT_PATH} rev-parse --abbrev-ref HEAD`, { encoding: 'utf8' }).trim();
    if (branchInfo) {
      branchName = branchInfo;
    }
  } catch (e) {}

  console.log(`Pushing branch ${branchName} to origin...`);
  execSync(`${GIT_PATH} push -u origin ${branchName} --force`, { stdio: 'inherit' });
  console.log('Successfully pushed code to GitHub private repository!');
}

run().catch(err => {
  console.error('Error occurred:', err);
  process.exit(1);
});
