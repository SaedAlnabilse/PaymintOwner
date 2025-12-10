const fs = require('fs');
const path = require('path');

const buildGradlePath = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-push-notification',
  'android',
  'build.gradle'
);

if (fs.existsSync(buildGradlePath)) {
  let content = fs.readFileSync(buildGradlePath, 'utf8');
  
  // Replace jcenter() with mavenCentral()
  content = content.replace(/jcenter\(\)/g, '');
  
  fs.writeFileSync(buildGradlePath, content, 'utf8');
  console.log('✅ Patched react-native-push-notification build.gradle');
} else {
  console.log('⚠️  react-native-push-notification build.gradle not found');
}
