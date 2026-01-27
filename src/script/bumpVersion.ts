import fs from 'fs';
import path from 'path';
import readline from 'readline';

const androidGradlePath = path.resolve(__dirname, '../app/android/app/build.gradle');
const iosProjectPath = path.resolve(__dirname, '../app/ios/App/App.xcodeproj/project.pbxproj');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

async function main() {
  console.log('Reading version files...');

  if (!fs.existsSync(androidGradlePath)) {
    console.error(`Error: Android gradle file not found at ${androidGradlePath}`);
    process.exit(1);
  }
  if (!fs.existsSync(iosProjectPath)) {
    console.error(`Error: iOS project file not found at ${iosProjectPath}`);
    process.exit(1);
  }

  let androidContent = fs.readFileSync(androidGradlePath, 'utf8');
  let iosContent = fs.readFileSync(iosProjectPath, 'utf8');

  // Parse current Android versions
  const specificVersionCodeRegex = /versionCode\s+(\d+)/;
  const specificVersionNameRegex = /versionName\s+"([^"]+)"/;
  
  const androidCodeMatch = androidContent.match(specificVersionCodeRegex);
  const androidNameMatch = androidContent.match(specificVersionNameRegex);

  if (!androidCodeMatch || !androidNameMatch) {
    console.error('Error: Could not parse Android version info.');
    process.exit(1);
  }

  const currentVersionCode = parseInt(androidCodeMatch[1], 10);
  const currentVersionName = androidNameMatch[1];

  // Parse current iOS versions
  const iosCodeMatch = iosContent.match(/CURRENT_PROJECT_VERSION = (\d+);/);
  const iosNameMatch = iosContent.match(/MARKETING_VERSION = ([^;]+);/);

  const currentIosVersionCode = iosCodeMatch ? iosCodeMatch[1] : 'Unknown';
  const currentIosVersionName = iosNameMatch ? iosNameMatch[1] : 'Unknown';

  console.log('\n--- Current Versions ---');
  console.log(`Android: Code=${currentVersionCode}, Name="${currentVersionName}"`);
  console.log(`iOS:     Code=${currentIosVersionCode}, Name=${currentIosVersionName}`);
  console.log('------------------------\n');

  // Determine new versions
  const newVersionCode = currentVersionCode + 1;
  const newVersionName = await question(`Enter new version name (current: ${currentVersionName}): `) || currentVersionName;

  console.log(`\nNew Version: Code=${newVersionCode}, Name="${newVersionName}"`);

  // Update Android
  androidContent = androidContent.replace(specificVersionCodeRegex, `versionCode ${newVersionCode}`);
  androidContent = androidContent.replace(specificVersionNameRegex, `versionName "${newVersionName}"`);
  
  fs.writeFileSync(androidGradlePath, androidContent);
  console.log('✅ Updated Android build.gradle');

  // Update iOS
  // iOS project.pbxproj often has multiple entries for these. We need to update all of them safely.
  const iosVersionCodeRegex = /CURRENT_PROJECT_VERSION = (\d+);/g;
  const iosVersionNameRegex = /MARKETING_VERSION = ([^;]+);/g;

  let iosUpdateCount = 0;
  iosContent = iosContent.replace(iosVersionCodeRegex, (match, p1) => {
    iosUpdateCount++;
    return `CURRENT_PROJECT_VERSION = ${newVersionCode};`; 
  });
  
  iosContent = iosContent.replace(iosVersionNameRegex, (match, p1) => {
     return `MARKETING_VERSION = ${newVersionName};`;
  });

  fs.writeFileSync(iosProjectPath, iosContent);
  console.log(`✅ Updated iOS project.pbxproj (${iosUpdateCount} occurrences of build number)`);

  rl.close();
}

main();
