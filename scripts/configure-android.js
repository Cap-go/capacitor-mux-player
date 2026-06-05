#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const pluginName = 'CapgoCapacitorMuxPlayer';
const rootDir = process.env.CAPACITOR_ROOT_DIR;
const platform = process.env.CAPACITOR_PLATFORM_NAME;
const muxRepositoryUrl = 'https://muxinc.jfrog.io/artifactory/default-maven-release-local';

const managedBlockStart = '// Capgo Mux Player Maven repository (auto-generated)';
const managedBlockEnd = '// End Capgo Mux Player Maven repository';
const managedBlock = `${managedBlockStart}
allprojects {
    repositories {
        maven {
            url '${muxRepositoryUrl}'
        }
    }
}
${managedBlockEnd}`;

function log(message) {
  console.log(`[${pluginName}] ${message}`);
}

function warn(message) {
  console.warn(`[${pluginName}] ${message}`);
}

function removeManagedBlock(content) {
  const escapedStart = managedBlockStart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedEnd = managedBlockEnd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`\\n?${escapedStart}[\\s\\S]*?${escapedEnd}\\n?`, 'm');
  return content.replace(pattern, '\n');
}

function configureAndroidRepository() {
  if (platform !== 'android') {
    return;
  }

  if (!rootDir) {
    warn('Skipping Android configuration because CAPACITOR_ROOT_DIR is missing.');
    return;
  }

  const buildGradlePath = path.join(rootDir, 'android', 'build.gradle');
  if (!fs.existsSync(buildGradlePath)) {
    warn('Skipping Android configuration because android/build.gradle was not found.');
    return;
  }

  const currentContent = fs.readFileSync(buildGradlePath, 'utf8');
  const withoutManagedBlock = removeManagedBlock(currentContent).trimEnd();
  if (withoutManagedBlock.includes(muxRepositoryUrl)) {
    if (currentContent.includes(managedBlockStart) && currentContent !== `${withoutManagedBlock}\n`) {
      fs.writeFileSync(buildGradlePath, `${withoutManagedBlock}\n`, 'utf8');
    }
    log('Android Mux Maven repository is already configured.');
    return;
  }

  const nextContent = `${withoutManagedBlock}\n\n${managedBlock}\n`;
  if (currentContent === nextContent) {
    log('Android Mux Maven repository is already configured.');
    return;
  }

  fs.writeFileSync(buildGradlePath, nextContent, 'utf8');
  log('Configured Android Mux Maven repository.');
}

configureAndroidRepository();
