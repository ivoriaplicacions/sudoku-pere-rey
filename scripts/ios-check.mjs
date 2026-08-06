/**
 * iOS builds require macOS + Xcode. On Windows this prints guidance instead of failing silently.
 */
if (process.platform === 'darwin') {
  console.log('macOS detected. You can run: npx cap add ios && npx cap sync ios && npx cap open ios');
  process.exit(0);
}

console.log(`
iOS development is not available on ${process.platform}.

  • Use a Mac with Xcode to add the iOS project:
      npm i @capacitor/ios
      npx cap add ios
      npm run build && npx cap sync ios
      npx cap open ios

  • Or use a macOS CI runner (GitHub Actions) for App Store builds.

Web and Android development work fully on Windows.
`);
