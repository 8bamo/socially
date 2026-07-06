// Entfernt Extended Attributes (z. B. com.apple.provenance), die beim Entpacken
// der Electron-Binärdateien entstehen und den anschließenden codesign-Schritt
// mit "resource fork, Finder information, or similar detritus not allowed" scheitern lassen.
const { execFileSync } = require('child_process');

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') return;
  execFileSync('xattr', ['-cr', context.appOutDir]);
};
