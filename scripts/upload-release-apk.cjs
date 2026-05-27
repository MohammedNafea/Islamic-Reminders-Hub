const fs = require('fs');
const path = require('path');

const GITHUB_TOKEN = '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';
const owner = 'MohammedNafea';
const repo = 'Islamic-Reminders-Hub';
const tag = 'v1.0.0';
const filePath = 'd:/Islamic-Reminders-Hub/artifacts/adhkar_app/build/app/outputs/flutter-apk/app-release.apk';
const assetName = 'adhkar.apk';

async function main() {
  console.log(`Getting release for tag ${tag}...`);
  const releaseRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/tags/${tag}`, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'Node-Fetch'
    }
  });

  if (!releaseRes.ok) {
    const errText = await releaseRes.text();
    throw new Error(`Failed to get release: ${releaseRes.status} ${errText}`);
  }

  const releaseData = await releaseRes.json();
  const releaseId = releaseData.id;
  const uploadUrlTemplate = releaseData.upload_url;
  console.log(`Release ID: ${releaseId}`);
  
  // Find if adhkar.apk already exists
  const existingAsset = releaseData.assets.find(a => a.name === assetName);
  if (existingAsset) {
    console.log(`Found existing asset "${assetName}" with ID ${existingAsset.id}. Deleting it...`);
    const deleteRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/assets/${existingAsset.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Node-Fetch'
      }
    });
    if (!deleteRes.ok) {
      const errText = await deleteRes.text();
      throw new Error(`Failed to delete existing asset: ${deleteRes.status} ${errText}`);
    }
    console.log(`Deleted existing asset.`);
  }

  // Upload the new APK
  const uploadUrl = uploadUrlTemplate.replace('{?name,label}', `?name=${assetName}`);
  const fileBuffer = fs.readFileSync(filePath);
  console.log(`Uploading ${filePath} (${fileBuffer.length} bytes) as ${assetName} to ${uploadUrl}...`);
  
  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Length': fileBuffer.length,
      'User-Agent': 'Node-Fetch'
    },
    body: fileBuffer
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Upload failed: ${uploadRes.status} ${errText}`);
  }

  const uploadData = await uploadRes.json();
  console.log('Upload successful! Asset details:', uploadData.browser_download_url);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
