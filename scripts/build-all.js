const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function build() {
    try {
        const rootDir = path.join(__dirname, '..');
        const clientDir = path.join(rootDir, 'client');
        const distDir = path.join(clientDir, 'dist');
        const adminDistDir = path.join(clientDir, 'dist-admin');
        const targetAdminDir = path.join(distDir, 'admin');

        console.log('🚀 Starting Full Production Build...');

        // 1. Build Customer App
        console.log('📦 Building Customer App...');
        const vitePath = path.join(clientDir, 'node_modules/.bin/vite');
        if (!fs.existsSync(vitePath)) {
            console.log('⚠️ Vite not found in node_modules, attempting to install client deps...');
            execSync('npm install', { cwd: clientDir, stdio: 'inherit' });
        }
        execSync('npm run build', { cwd: clientDir, stdio: 'inherit' });

        // 2. Build Admin App
        console.log('👑 Building Admin App...');
        execSync('npm run build-admin', { cwd: clientDir, stdio: 'inherit' });

        // 3. Merge Builds
        console.log('🔄 Merging Admin into Main Dist...');
        
        // Ensure target admin dir exists
        if (!fs.existsSync(targetAdminDir)) {
            fs.mkdirSync(targetAdminDir, { recursive: true });
        }
        
        // Copy everything from dist-admin to dist/admin
        // Note: fs.cpSync requires Node.js 16.7.0+
        if (fs.cpSync) {
            fs.cpSync(adminDistDir, targetAdminDir, { recursive: true });
        } else {
            // Fallback for older node versions (unlikely on Render)
            console.log('⚠️ fs.cpSync not available, using shell copy');
            const copyCmd = process.platform === 'win32' 
                ? `xcopy /E /I /Y "${adminDistDir}" "${targetAdminDir}"`
                : `cp -r "${adminDistDir}/." "${targetAdminDir}"`;
            execSync(copyCmd, { stdio: 'inherit' });
        }
        
        // Rename admin.html to index.html in the subfolder
        const adminHtml = path.join(targetAdminDir, 'admin.html');
        const adminIndex = path.join(targetAdminDir, 'index.html');
        
        if (fs.existsSync(adminHtml)) {
            fs.renameSync(adminHtml, adminIndex);
            console.log('✅ Admin entry point configured.');
        }

        // 4. Cleanup
        console.log('扫 Cleaning up temporary files...');
        if (fs.rmSync) {
            fs.rmSync(adminDistDir, { recursive: true, force: true });
        } else {
            const rmCmd = process.platform === 'win32' ? `rmdir /s /q "${adminDistDir}"` : `rm -rf "${adminDistDir}"`;
            execSync(rmCmd, { stdio: 'inherit' });
        }

        console.log('✨ Build Complete! Production files are in client/dist');
    } catch (err) {
        console.error('❌ Build failed:', err);
        process.exit(1);
    }
}

build();
