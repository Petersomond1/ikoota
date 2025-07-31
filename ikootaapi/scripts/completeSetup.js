// ikootaapi/scripts/completeSetup.js
// ===============================================
// COMPLETE SETUP SCRIPT
// One-command setup for admin membership endpoints
// ===============================================

import { verifyDatabase, createSampleData, createAdminUser, fullSetup } from './verifyDatabase.js';
import { quickTest, runAllTests } from './testAdminEndpoints.js';
import fs from 'fs';
import path from 'path';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// Check if required files exist
const checkRequiredFiles = () => {
  log('\n🔍 Checking required files...', 'cyan');
  
  const requiredFiles = [
    { path: 'routes/adminMembershipRoutes.js', description: 'Admin routes file' },
    { path: 'config/db.js', description: 'Database configuration' },
    { path: 'middlewares/auth.middleware.js', description: 'Authentication middleware' }
  ];
  
  const missing = [];
  
  requiredFiles.forEach(file => {
    if (fs.existsSync(file.path)) {
      log(`  ✅ ${file.description}: ${file.path}`, 'green');
    } else {
      log(`  ❌ ${file.description}: ${file.path} (MISSING)`, 'red');
      missing.push(file);
    }
  });
  
  if (missing.length > 0) {
    log('\n⚠️  Missing required files:', 'yellow');
    missing.forEach(file => {
      log(`     - ${file.path}: ${file.description}`, 'yellow');
    });
    
    log('\n📋 Next steps:', 'blue');
    log('  1. Create the missing files using the provided artifacts');
    log('  2. Ensure your server.js mounts the admin routes');
    log('  3. Run this script again');
    
    return false;
  }
  
  log('✅ All required files present!', 'green');
  return true;
};

// Check server configuration
const checkServerConfig = () => {
  log('\n🔍 Checking server configuration...', 'cyan');
  
  const serverFiles = ['server.js', 'app.js', 'index.js'];
  let serverFile = null;
  
  for (const file of serverFiles) {
    if (fs.existsSync(file)) {
      serverFile = file;
      break;
    }
  }
  
  if (!serverFile) {
    log('❌ No server file found (server.js, app.js, or index.js)', 'red');
    return false;
  }
  
  log(`✅ Server file found: ${serverFile}`, 'green');
  
  const serverContent = fs.readFileSync(serverFile, 'utf8');
  
  // Check if admin routes are imported and mounted
  const hasAdminImport = serverContent.includes('adminMembershipRouter') || 
                        serverContent.includes('adminMembershipRoutes');
  const hasAdminMount = serverContent.includes('/api/admin/membership');
  
  if (hasAdminImport && hasAdminMount) {
    log('✅ Admin routes appear to be properly configured', 'green');
    return true;
  } else {
    log('⚠️  Admin routes may not be properly configured:', 'yellow');
    if (!hasAdminImport) log('    - Missing admin routes import', 'yellow');
    if (!hasAdminMount) log('    - Missing admin routes mounting', 'yellow');
    
    log('\n📋 Add this to your server file:', 'blue');
    log('  import adminMembershipRouter from \'./routes/adminMembershipRoutes.js\';', 'cyan');
    log('  app.use(\'/api/admin/membership\', adminMembershipRouter);', 'cyan');
    
    return false;
  }
};

// Interactive setup wizard
const runSetupWizard = async () => {
  log('\n🧙‍♂️ Setup Wizard', 'magenta');
  log('================', 'magenta');
  
  try {
    // Step 1: File checks
    log('\n📁 Step 1: File Requirements', 'bright');
    const filesOk = checkRequiredFiles();
    
    if (!filesOk) {
      log('\n❌ Setup cannot continue without required files', 'red');
      process.exit(1);
    }
    
    // Step 2: Server configuration
    log('\n⚙️  Step 2: Server Configuration', 'bright');
    const serverOk = checkServerConfig();
    
    if (!serverOk) {
      log('\n⚠️  Server configuration issues detected', 'yellow');
      log('   You can continue, but endpoints may not work until fixed', 'yellow');
    }
    
    // Step 3: Database setup
    log('\n🗄️  Step 3: Database Setup', 'bright');
    log('Running full database setup...', 'cyan');
    await fullSetup();
    
    // Step 4: Test endpoints
    log('\n🧪 Step 4: Testing Endpoints', 'bright');
    log('Running connectivity test...', 'cyan');
    
    try {
      await quickTest();
      log('✅ Basic connectivity test passed!', 'green');
    } catch (error) {
      log('❌ Connectivity test failed:', 'red');
      log(`   ${error.message}`, 'red');
      log('   This is expected if your server is not running', 'yellow');
    }
    
    // Step 5: Final instructions
    log('\n🎉 Setup Complete!', 'bright');
    log('==================', 'bright');
    
    log('\n📋 Next Steps:', 'blue');
    log('  1. Start your server:', 'blue');
    log('     npm start  # or node server.js', 'cyan');
    
    log('\n  2. Test the endpoints:', 'blue');
    log('     node scripts/testAdminEndpoints.js --quick', 'cyan');
    
    log('\n  3. Update your frontend:', 'blue');
    log('     Use the updated FullMembershipReviewControls.jsx', 'cyan');
    
    log('\n  4. Full testing:', 'blue');
    log('     node scripts/testAdminEndpoints.js', 'cyan');
    
    log('\n🔑 Admin Credentials Created:', 'yellow');
    log('   Check the database verification output above for admin user details', 'yellow');
    
    log('\n🚀 Your admin membership endpoints should now be working!', 'green');
    
  } catch (error) {
    log('\n❌ Setup wizard failed:', 'red');
    log(`   ${error.message}`, 'red');
    process.exit(1);
  }
};

// Quick diagnostic
const runDiagnostic = async () => {
  log('\n🔍 Admin Endpoints Diagnostic', 'cyan');
  log('=============================', 'cyan');
  
  // Check files
  log('\n📁 File Check:', 'bright');
  checkRequiredFiles();
  
  // Check server config
  log('\n⚙️  Server Config:', 'bright');
  checkServerConfig();
  
  // Test database
  log('\n🗄️  Database Check:', 'bright');
  try {
    await verifyDatabase();
  } catch (error) {
    log(`❌ Database error: ${error.message}`, 'red');
  }
  
  // Test endpoints (if server is running)
  log('\n🌐 Endpoint Check:', 'bright');
  try {
    await quickTest();
  } catch (error) {
    log(`❌ Endpoint test failed: ${error.message}`, 'red');
    log('   Make sure your server is running', 'yellow');
  }
  
  log('\n📊 Diagnostic Complete', 'green');
};

// Generate documentation
const generateDocs = () => {
  log('\n📚 Generating documentation...', 'cyan');
  
  const docs = `# Admin Membership Endpoints Documentation

Generated on: ${new Date().toISOString()}

## Available Endpoints

### 1. Test Endpoint
\`\`\`
GET /api/admin/membership/test
\`\`\`
- **Purpose**: Test connectivity and authentication
- **Auth**: Admin required
- **Response**: Server status and user info

### 2. Get Applications
\`\`\`
GET /api/admin/membership/applications?status={status}
\`\`\`
- **Purpose**: Fetch membership applications by status
- **Auth**: Admin required
- **Parameters**: 
  - \`status\`: pending, approved, declined, suspended, all
- **Response**: Array of applications with user details

### 3. Get Statistics
\`\`\`
GET /api/admin/membership/full-membership-stats
\`\`\`
- **Purpose**: Get membership statistics summary
- **Auth**: Admin required
- **Response**: Object with counts by status

### 4. Get Pending Count
\`\`\`
GET /api/admin/membership/pending-count
\`\`\`
- **Purpose**: Quick count of pending applications
- **Auth**: Admin required
- **Response**: Number of pending applications

### 5. Review Application
\`\`\`
PUT /api/admin/membership/applications/:id/review
\`\`\`
- **Purpose**: Review individual application
- **Auth**: Admin required
- **Body**: 
  \`\`\`json
  {
    "status": "approved|declined|suspended",
    "adminNotes": "Review notes"
  }
  \`\`\`

### 6. Bulk Review
\`\`\`
POST /api/admin/membership/applications/bulk-review
\`\`\`
- **Purpose**: Review multiple applications at once
- **Auth**: Admin required
- **Body**:
  \`\`\`json
  {
    "applicationIds": [1, 2, 3],
    "decision": "approved|declined|suspended",
    "notes": "Bulk review notes"
  }
  \`\`\`

## Testing

### Quick Test
\`\`\`bash
node scripts/testAdminEndpoints.js --quick
\`\`\`

### Full Test Suite
\`\`\`bash
node scripts/testAdminEndpoints.js
\`\`\`

### Database Setup
\`\`\`bash
node scripts/verifyDatabase.js --full-setup
\`\`\`

## Authentication

All endpoints require:
- Valid JWT token in Authorization header
- User role must be 'admin' or 'super_admin'

## Error Handling

All endpoints return standardized error responses:
\`\`\`json
{
  "success": false,
  "error": "Error message",
  "timestamp": "ISO timestamp"
}
\`\`\`
`;

  fs.writeFileSync('docs/admin-endpoints.md', docs);
  log('✅ Documentation generated: docs/admin-endpoints.md', 'green');
};

// Main function
const main = async () => {
  const args = process.argv.slice(2);
  
  log('🚀 Admin Membership Setup Tool', 'bright');
  log('===============================', 'bright');
  
  if (args.includes('--wizard')) {
    await runSetupWizard();
  } else if (args.includes('--diagnostic')) {
    await runDiagnostic();
  } else if (args.includes('--docs')) {
    generateDocs();
  } else if (args.includes('--files-only')) {
    checkRequiredFiles();
  } else if (args.includes('--server-only')) {
    checkServerConfig();
  } else {
    // Default: run setup wizard
    await runSetupWizard();
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    log(`\n❌ Setup failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

log('\n📚 Usage:', 'blue');
log('  node completeSetup.js             # Run setup wizard (default)', 'cyan');
log('  node completeSetup.js --wizard    # Run interactive setup wizard', 'cyan');
log('  node completeSetup.js --diagnostic # Run diagnostic checks', 'cyan');
log('  node completeSetup.js --docs       # Generate documentation', 'cyan');
log('  node completeSetup.js --files-only # Check files only', 'cyan');
log('  node completeSetup.js --server-only # Check server config only', 'cyan');

export { runSetupWizard, runDiagnostic, checkRequiredFiles, checkServerConfig };