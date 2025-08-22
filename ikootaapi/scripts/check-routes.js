// scripts/check-routes.js - Run this to see which routes are loaded
//ikootaapi\scripts\check-routes.js
import express from 'express';

function getRoutes(app) {
  const routes = [];
  
  function extractRoutes(router, basePath = '') {
    if (router && router.stack) {
      router.stack.forEach(layer => {
        if (layer.route) {
          // Direct route
          const methods = Object.keys(layer.route.methods);
          routes.push({
            path: basePath + layer.route.path,
            methods: methods.join(', ').toUpperCase(),
            type: 'route'
          });
        } else if (layer.name === 'router' && layer.handle.stack) {
          // Nested router
          const routerBasePath = basePath + (layer.regexp.source.replace(/\$|\^|\\|\//g, '').replace(/\|\?/g, '') || '');
          extractRoutes(layer.handle, routerBasePath);
        }
      });
    }
  }
  
  extractRoutes(app._router);
  return routes;
}

// Create a test app to check route loading
const testApp = express();

console.log('🔍 Testing Route Imports...\n');

try {
  // Test importing auth routes
  console.log('📋 Importing authRoutes...');
  const authRoutes = await import('../routes/authRoutes.js');
  console.log('✅ authRoutes imported successfully');
  
  // Mount the routes
  testApp.use('/api/auth', authRoutes.default);
  console.log('✅ authRoutes mounted at /api/auth');
  
  // Extract and display routes
  const routes = getRoutes(testApp);
  
  console.log('\n📊 Discovered Routes:');
  console.log('==================');
  
  if (routes.length === 0) {
    console.log('❌ No routes found! This indicates a problem with route mounting.');
  } else {
    routes.forEach(route => {
      console.log(`${route.methods.padEnd(6)} ${route.path}`);
    });
  }
  
  // Check for specific auth routes
  const expectedAuthRoutes = [
    'POST /api/auth/send-verification',
    'POST /api/auth/register', 
    'POST /api/auth/login',
    'GET /api/auth/logout',
    'GET /api/auth/test-simple'
  ];
  
  console.log('\n🎯 Expected Auth Routes Check:');
  console.log('===============================');
  
  expectedAuthRoutes.forEach(expectedRoute => {
    const [method, path] = expectedRoute.split(' ');
    const found = routes.some(route => 
      route.path === path && route.methods.includes(method)
    );
    console.log(`${found ? '✅' : '❌'} ${expectedRoute}`);
  });
  
} catch (error) {
  console.error('❌ Error testing routes:', error.message);
  console.error('Stack:', error.stack);
}

console.log('\n🔍 Route Import Test Complete');