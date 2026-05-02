import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  BellRing,
  ImagePlus,
  Layers3,
  Package,
  Shield,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react";
import { AdminPage, AdminPanel } from "@/components/admin-components/AdminUI";
import { pageVariants, containerVariants, itemVariants } from "@/components/admin-components/_shared/animations";

const Features = () => {
  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="w-full min-h-0">
      <AdminPage
        eyebrow="Admin Features"
        title="Control center shortcuts"
        description="Jump directly into key admin workflows from one place."
      >
        <motion.div
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {[
            { to: "/admin/order", label: "Orders", icon: ShoppingCart },
            { to: "/admin/product", label: "Products", icon: Package },
            { to: "/admin/drop", label: "Drops", icon: Layers3 },
            { to: "/admin/users", label: "Users", icon: Users },
            { to: "/admin/reviews", label: "Reviews", icon: Shield },
            { to: "/admin/notifications", label: "Notifications", icon: BellRing },
            { to: "/admin/home-images", label: "Homepage Media", icon: ImagePlus },
            { to: "/admin/payments/pending", label: "Manual Payments", icon: Wallet },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <motion.div key={item.to} variants={itemVariants}>
                <Link
                  to={item.to}
                  className="admin-panel block transition hover:border-[#D4AF37]/40"
                >
                  <motion.div
                    whileHover={{ y: -3, borderColor: "rgba(212,175,55,0.35)" }}
                    transition={{ duration: 0.2 }}
                    className="rounded-[inherit]"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-white">{item.label}</p>
                      <Icon className="h-5 w-5 text-[#D4AF37]" />
                    </div>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-gray-500">Open module</p>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
        <AdminPanel
          title="Feature parity note"
          description="This page now acts as a launcher for all rebuilt admin modules."
        >
          <p className="text-sm text-gray-300">
            Keep this page as a quick-entry board for operators who switch between payments, moderation, and catalog
            updates.
          </p>
        </AdminPanel>
      </AdminPage>
    </motion.div>
  );
};

export default Features;
