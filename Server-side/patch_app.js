const fs = require('fs');
const path = '../Client-Side/src/App.jsx';
let content = fs.readFileSync(path, 'utf8');

// Ensure OffersPage is imported
if (!content.includes('import OffersPage')) {
  content = content.replace(
    /import ContactPage from \'\.\/pages\/user\/ContactPage\';/,
    "import ContactPage from './pages/user/ContactPage';\nimport OffersPage from './pages/user/OffersPage';"
  );
}

// Ensure the route is added
if (!content.includes('path="/offers"')) {
  content = content.replace(
    /<Route path="\/contact" element=\{<ContactPage \/>\} \/>/,
    '<Route path="/offers" element={<OffersPage />} />\n            <Route path="/contact" element={<ContactPage />} />'
  );
}

// Add the Admin UI for Offers if not present
if (!content.includes('path="offers-management"')) {
   if (!content.includes('import AdminOffers')) {
        content = content.replace(
            "import AdminFeatures",
            "import AdminFeatures\nimport AdminOffers from './pages/admin/AdminOffers';"
        );
   }
   content = content.replace(
       /<Route path=\"feature\" element=\{<PermissionGuard permission=\"products\"\><AdminFeatures \/><\/PermissionGuard>\} \/>/,
       '<Route path="feature" element={<PermissionGuard permission="products"><AdminFeatures /></PermissionGuard>} />\n            <Route path="offers-management" element={<PermissionGuard permission="products"><AdminOffers /></PermissionGuard>} />'
   );
}

fs.writeFileSync(path, content);
console.log('App.jsx patched with Offers routing routes.');
