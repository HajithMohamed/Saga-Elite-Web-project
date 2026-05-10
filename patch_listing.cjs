const fs = require('fs');

const path = 'Client-Side/src/pages/shopping-view/ProductListing.jsx';
let content = fs.readFileSync(path, 'utf8');

// Replace imports
content = content.replace(
  'import RefineRow from "@/components/listing/RefineRow";',
  'import FilterSidebar from "@/components/listing/FilterSidebar";'
);

// Remove unwanted components imports
content = content.replace('import CommunityStylingStrip from "@/components/listing/CommunityStylingStrip";', '');
content = content.replace('import FeaturedHighlightCard from "@/components/listing/FeaturedHighlightCard";', '');
content = content.replace('import TrustStrip from "@/components/listing/TrustStrip";', '');
content = content.replace('import RecentlyViewedCarousel from "@/components/listing/RecentlyViewedCarousel";', '');

// Replace the main UI container from <div className="sticky top-16 z-30... to the end of main layout
// We'll just replace the RefineRow toggle and layout. We can use a regex to slice.

fs.writeFileSync(path, content);
console.log("Updated imports.");
