const fs = require('fs');
const path = require('path');

// List of all modules
const modules = [
  'abandoned-cart',
  'agentic-commerce', 
  'analytics',
  'custom-item-pricing',
  'first-purchase-discount',
  'gift-message',
  'invoice-generation',
  'loyalty-points',
  'meta-product-feed',
  'newsletter',
  'phone-auth',
  'product-builder',
  'product-reviews',
  'quote-management',
  'reorder',
  'saved-payment-methods',
  'wishlist'
];

// Fix each module
modules.forEach(moduleName => {
  const indexPath = `src/modules/${moduleName}/index.ts`;
  
  // Read the service file to get the service class name
  const servicePath = `src/modules/${moduleName}/service.ts`;
  let serviceContent = '';
  
  try {
    serviceContent = fs.readFileSync(servicePath, 'utf8');
  } catch (error) {
    console.log(`Could not read ${servicePath}: ${error.message}`);
    return;
  }
  
  // Extract service class name from export default class
  const serviceMatch = serviceContent.match(/export default class (\w+)/);
  if (!serviceMatch) {
    console.log(`Could not find service class in ${servicePath}`);
    return;
  }
  
  const serviceClassName = serviceMatch[1];
  
  // Create the correct index.ts content
  const indexContent = `import { Module } from '@medusajs/utils'
import ${serviceClassName} from './service'

export default Module("${moduleName}Service", {
  service: ${serviceClassName}
})
`;
  
  // Write the fixed index.ts
  fs.writeFileSync(indexPath, indexContent);
  console.log(`Fixed ${indexPath}`);
});

console.log('All module exports have been fixed!');
