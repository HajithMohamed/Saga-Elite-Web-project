import { Suspense, lazy, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import {
  Loader2,
  Layout,
  ScrollText,
  FileText,
  Bell,
  MessageSquare,
  ImageIcon,
} from "lucide-react";

// Single "Content Management" shell that hosts the existing SiteConfig manager
// pages as tabs. Each manager brings its own AdminPage chrome — we don't touch
// their internals, just mount the active one. The active tab is mirrored to a
// `?tab=` query param so the legacy /admin/<page> routes can redirect deep-link.
const AboutSiteConfig = lazy(() => import("./AboutSiteConfig"));
const HomepageImageManager = lazy(() => import("./HomepageImageManager"));
const PoliciesManager = lazy(() => import("./PoliciesManager"));
const FooterManager = lazy(() => import("./FooterManager"));
const AnnouncementBar = lazy(() => import("./AnnouncementBar"));
const ContactPageManager = lazy(() => import("./ContactPageManager"));

const TABS = [
  { id: "about", label: "Brand & About", icon: Layout, Component: AboutSiteConfig },
  { id: "images", label: "Homepage Images", icon: ImageIcon, Component: HomepageImageManager },
  { id: "policies", label: "Policies", icon: ScrollText, Component: PoliciesManager },
  { id: "footer", label: "Footer", icon: FileText, Component: FooterManager },
  { id: "announcement", label: "Announcement", icon: Bell, Component: AnnouncementBar },
  { id: "contact", label: "Contact & FAQ", icon: MessageSquare, Component: ContactPageManager },
];

const ContentManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("tab");

  const active = useMemo(
    () => TABS.find((t) => t.id === requested) || TABS[0],
    [requested]
  );
  const ActiveComponent = active.Component;

  const selectTab = (id) => {
    setSearchParams(id === TABS[0].id ? {} : { tab: id }, { replace: true });
  };

  return (
    <div className="w-full">
      {/* Tab bar */}
      <div className="sticky top-0 z-20 -mx-4 mb-2 border-b border-line/50 bg-page/90 px-4 py-3 backdrop-blur-md md:-mx-6 md:px-6">
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === active.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => selectTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition-all ${
                  isActive
                    ? "border-gold-ink2/60 bg-gold-deep/10 text-gold-ink"
                    : "border-transparent text-muted hover:border-line hover:bg-panel hover:text-ink-2"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active manager (renders its own AdminPage shell) */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-24 text-muted">
            <Loader2 className="h-6 w-6 animate-spin text-gold-ink2" />
          </div>
        }
      >
        <motion.div
          key={active.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <ActiveComponent />
        </motion.div>
      </Suspense>
    </div>
  );
};

export default ContentManagement;
