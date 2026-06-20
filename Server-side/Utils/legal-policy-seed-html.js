/** Seed HTML for policy_* SiteConfig keys — mirrors LEGAL_POLICY_DOCUMENT.txt + Delivery page. */

const POLICY_META = {
  lastUpdated: "2026-05-02",
};

const privacyHtml = `
<section class="space-y-3"><h2 id="introduction">Introduction</h2><p>This policy covers what data Saga Elite collects, why we collect it, and how it is used to deliver our services.</p></section>
<section class="space-y-3"><h2 id="data-we-collect">Data We Collect</h2><p>We may collect the following personal and technical data:</p><ul><li>Name, email, phone number, and delivery address.</li><li>Order history and purchase records.</li><li>Technical data such as IP address.</li></ul><p><strong>Note:</strong> Payment card data is handled securely by PayHere. We never store or process your card details on our servers.</p></section>
<section class="space-y-3"><h2 id="how-we-use-your-data">How We Use Your Data</h2><ul><li>Processing and fulfilling your orders.</li><li>Sending order and shipping notifications via WhatsApp (+94 77 070 4274) and email.</li><li>Providing responsive customer support.</li><li>Sending marketing and promotional emails (these invariably contain an opt-out link).</li></ul></section>
<section class="space-y-3"><h2 id="data-sharing">Data Sharing</h2><p>We partner with select third-party services to fulfill our business operations. These include:</p><ul><li><strong>PayHere:</strong> For secure payment processing.</li><li><strong>Cloudinary:</strong> For image hosting and management.</li><li><strong>Mailtrap/Nodemailer:</strong> To facilitate email delivery.</li></ul><p><strong>We do NOT sell your data to any third parties.</strong></p></section>
<section class="space-y-3"><h2 id="data-storage">Data Storage</h2><ul><li>All your personal data is stored securely on <strong>MongoDB Atlas</strong> databases.</li><li>We employ industry-standard <strong>SSL/TLS encryption</strong> to protect data in transit.</li><li>Your personal data is retained for exactly <strong>2 years</strong> following your last order with us.</li></ul></section>
<section class="space-y-3"><h2 id="your-rights">Your Rights</h2><p>Under data protection laws, you retain essential rights regarding your personal data:</p><ul><li><strong>Access:</strong> Request a copy of the data we hold on you.</li><li><strong>Correction:</strong> Update any incorrect personal information.</li><li><strong>Deletion:</strong> Request permanent deletion of all your data from our systems.</li></ul><p>To exercise these rights, please contact us at <a href="mailto:sagaaelite@gmail.com">sagaaelite@gmail.com</a>.</p></section>
<section class="space-y-3"><h2 id="cookies">Cookies</h2><ul><li><strong>Session Cookies:</strong> Kept to allow you to log in smoothly during your visit.</li><li><strong>Preference Cookies:</strong> Used to remember your website layout and preferences.</li></ul><p>You have full control over cookies and can disable them within your browser settings.</p></section>
<section class="space-y-3"><h2 id="delivery-scope">Delivery Scope</h2><p>At present, we exclusively support deliveries within <strong>Sri Lanka</strong>.</p></section>
<section class="space-y-3"><h2 id="contact">Contact</h2><p>Saga Elite<br/>Email: <a href="mailto:sagaaelite@gmail.com">sagaaelite@gmail.com</a><br/>Phone: <a href="tel:+94770704274">+94 77 070 4274</a></p></section>`;

const termsHtml = `
<section class="space-y-3"><h2 id="acceptance-of-terms">Acceptance of terms</h2><p>By accessing or using Saga Elite, you agree to these terms and conditions. If you do not agree, please discontinue use of the site.</p></section>
<section class="space-y-3"><h2 id="about-saga-elite">About Saga Elite</h2><p>Saga Elite is a Sri Lankan fashion and lifestyle brand offering limited-edition apparel and accessories through our online store. There are no age restrictions on purchases, and we do not have any restricted product categories.</p></section>
<section class="space-y-3"><h2 id="products-pricing">Products and pricing</h2><ul><li>Prices are in LKR and subject to change without prior notice.</li><li>Product images are representative; colors may vary slightly.</li><li>We reserve the right to limit quantities.</li></ul></section>
<section class="space-y-3"><h2 id="ordering-payment">Ordering and payment</h2><ul><li>Order confirmation is sent via email and WhatsApp upon successful placement.</li><li>Manual payment orders require payment within 24 hours using the provided reference number.</li><li>Our official banking details for manual bank transfers:<ul><li><strong>Bank:</strong> Sampath Bank</li><li><strong>Branch:</strong> Hatton</li><li><strong>A/C Number:</strong> 108052612262</li><li><strong>Account Name:</strong> N.Gayathree</li></ul></li></ul></section>
<section class="space-y-3"><h2 id="shipping-delivery">Shipping and delivery</h2><ul><li>Delivery is strictly within Sri Lanka only.</li><li>Estimated delivery time is 15 days from order confirmation.</li><li>Risk transfers to the buyer once the order is shipped.</li></ul></section>
<section class="space-y-3"><h2 id="returns-refunds">Returns and refunds</h2><p>Please review our <a href="/legal/refund-policy">Refund &amp; Return Policy</a> for our policy on exchanges and final sales.</p></section>
<section class="space-y-3"><h2 id="governing-law">Governing law</h2><p>These terms are governed by the laws of Sri Lanka. Any disputes are subject to the jurisdiction of Sri Lankan courts.</p></section>
<section class="space-y-3"><h2 id="contact">Contact us</h2><p>For questions about these terms, contact us at:</p><ul><li><strong>Email:</strong> sagaaelite@gmail.com</li><li><strong>WhatsApp / Phone:</strong> +94 77 070 4274</li></ul></section>`;

const refundHtml = `
<section class="space-y-3"><h2 id="all-sales-final">All sales are final</h2><p><strong>All products are definitively NON-REFUNDABLE. We do not offer refunds under any circumstances.</strong></p><p>We take strict measures to ensure quality, but exchanges may be considered for defective or damaged items only, subject to management review. We do not offer store credit or exchanges for general changes of mind.</p></section>
<section class="space-y-3"><h2 id="return-window">Return window</h2><p>Our return window for exchanging defective or damaged items is 14 days from the delivery date. Items reported outside this 14-day window will not be eligible for review or exchange.</p></section>
<section class="space-y-3"><h2 id="defective-damaged">Defective or damaged items</h2><ul><li>If you receive a defective or damaged item, you must report it within 5 days of delivery.</li><li>To report an issue, please send clear photo proof of the defect or damage via WhatsApp to <strong>+94 77 070 4274</strong>.</li><li>Upon review, if the item is approved for exchange, we will provide further instructions.</li></ul></section>
<section class="space-y-3"><h2 id="return-shipping">Return shipping</h2><p>For any approved exchange, the return shipping cost must be paid by the customer. We recommend using a trackable shipping service, as we cannot guarantee that we will receive your returned item.</p></section>
<section class="space-y-3"><h2 id="refunds-manual-payments">Manual payment refunds</h2><p>In the rare operational exception where a manual payment refund is applicable and authorized by management (e.g., if an approved exchange item is permanently out of stock):</p><ul><li>Refunds will be processed via bank transfer to the customer's account.</li><li>Please expect 7-14 business days for the funds to be credited to your account.</li></ul></section>
<section class="space-y-3"><h2 id="contact-for-returns">Contact us for returns</h2><p>To initiate a defect report or if you have any questions about this policy, contact us:</p><ul><li><strong>Email:</strong> sagaaelite@gmail.com</li><li><strong>WhatsApp:</strong> +94 77 070 4274</li></ul></section>`;

const shippingHtml = `
<section class="space-y-3"><h2 id="coverage">Coverage</h2><p>We currently deliver anywhere within <strong>all of Sri Lanka only</strong>. At this time, we do not offer international shipping.</p></section>
<section class="space-y-3"><h2 id="processing-time">Processing Time</h2><p>All orders require a processing time of <strong>1-2 business days</strong> before shipping. Once your order has been processed, it will be handed over to our delivery partners.</p></section>
<section class="space-y-3"><h2 id="delivery-timeframe">Delivery Timeframe</h2><p>Please expect your items to arrive within <strong>15 days</strong> from the date of order confirmation. We strive to deliver as quickly as possible and will keep you updated.</p></section>
<section class="space-y-3"><h2 id="tracking">Tracking your order</h2><p>As soon as your order is shipped, we will share the tracking number with you via WhatsApp to the number provided at checkout.</p></section>
<section class="space-y-3"><h2 id="payment-methods">Accepted Payment Methods</h2><p>We do <strong>not</strong> offer an eZ cash payment option. We only accept bank transfers and mobile banking.</p><p><strong>Our Bank Details:</strong></p><ul><li><strong>Bank:</strong> Sampath Bank</li><li><strong>Branch:</strong> Hatton</li><li><strong>Name:</strong> N.Gayathree</li><li><strong>Account Number:</strong> 108052612262</li></ul></section>
<section class="space-y-3"><h2 id="delivery-issues">Delivery Issues</h2><p>If you have not received your order within 3 days of the expected delivery date, or if there is any issue with your delivery, please contact our support team immediately.</p><p>Reach us at <a href="https://wa.me/94770704274">+94 77 070 4274</a></p></section>`;

const buildPolicy = (html, metaTitle, metaDescription) => ({
  html: html.trim(),
  plainText: html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
  lastUpdated: POLICY_META.lastUpdated,
  metaTitle,
  metaDescription,
});

const POLICY_SEED_VALUES = {
  policy_privacy: buildPolicy(
    privacyHtml,
    "Privacy Policy",
    "Learn how Saga Elite collects, uses, and protects your personal data when you shop with us."
  ),
  policy_terms: buildPolicy(
    termsHtml,
    "Terms & Conditions",
    "Read the terms and conditions for using Saga Elite and placing orders on our store."
  ),
  policy_refund: buildPolicy(
    refundHtml,
    "Refund & Return Policy",
    "Understand Saga Elite return eligibility, exchange policy, and non-refundable items."
  ),
  policy_shipping: buildPolicy(
    shippingHtml,
    "Delivery Policy",
    "Read Saga Elite's delivery policy, processing times, and shipping coverage across Sri Lanka."
  ),
};

module.exports = { POLICY_SEED_VALUES };
