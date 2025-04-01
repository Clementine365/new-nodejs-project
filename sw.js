self.addEventListener('install', (event) => {
    console.log('Service Worker installing.');
    // Add caching or other functionality here
  });
  
  self.addEventListener('activate', (event) => {
    console.log('Service Worker activated.');
    // Clean up old caches or other necessary tasks
  });
  
  self.addEventListener('fetch', (event) => {
    console.log('Fetching:', event.request.url);
    // You can intercept and manage network requests here (e.g., caching)
  });
y  