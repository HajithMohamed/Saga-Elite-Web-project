import React from "react";
import { Link } from "react-router-dom";
import { BellRing, ImagePlus, Layers3, Package, Shield, ShoppingCart, Users, Wallet } from "lucide-react";
import { AdminPage, AdminPanel } from "@/components/admin-components/AdminUI";

const Features = () => {
  return (
    <AdminPage
      eyebrow="Admin Features"
      title="Control center shortcuts"
      description="Jump directly into key admin workflows from one place."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
            <Link key={item.to} to={item.to} className="admin-panel transition hover:border-[#D4AF37]/40">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-white">{item.label}</p>
                <Icon className="h-5 w-5 text-[#D4AF37]" />
              </div>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-gray-500">Open module</p>
            </Link>
          );
        })}
      </div>
      <AdminPanel title="Feature parity note" description="This page now acts as a launcher for all rebuilt admin modules.">
        <p className="text-sm text-gray-300">
          Keep this page as a quick-entry board for operators who switch between payments, moderation, and catalog updates.
        </p>
      </AdminPanel>
    </AdminPage>
  );
};

export default Features;
