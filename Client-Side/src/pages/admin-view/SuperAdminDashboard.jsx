import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdmins, fetchActivityLogs } from "../../store/admin/super-admin-slice";
import AdminTable from "./AdminTable";
import ActivityLogTable from "./ActivityLogTable";
import CreateAdminModal from "./CreateAdminModal";
import { AdminPage, AdminPanel } from "@/components/admin-components/AdminUI";
import {
  pageVariants,
  containerVariants,
  itemVariants,
} from "@/components/admin-components/_shared/animations";
import { AnimatedNumber } from "@/components/admin-components/_shared/AnimatedNumber";
import { SkeletonGrid } from "@/components/admin-components/_shared/SkeletonCard";

const TAB = { ADMINS: "admins", LOGS: "logs" };
const isSuperAdminRole = (role) => role === "super_admin" || role === "superadmin";

const SuperAdminDashboard = () => {
  const dispatch = useDispatch();
  const { admins, adminsLoading, adminsError, activityLogs } =
    useSelector((s) => s.superAdmin);
  const currentUser = useSelector((s) => s.auth?.user);

  const [tab, setTab] = useState(TAB.ADMINS);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchAdmins());
    dispatch(fetchActivityLogs({ page: 1, limit: 100 }));
  }, [dispatch]);

  const activeAdmins = admins.filter(
    (a) => a.isActive && !isSuperAdminRole(a.role)
  );
  const inactiveAdmins = admins.filter(
    (a) => !a.isActive && !isSuperAdminRole(a.role)
  );

  const filteredAdmins = admins.filter(
    (a) =>
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.email?.toLowerCase().includes(search.toLowerCase()) ||
      a.role?.toLowerCase().includes(search.toLowerCase()) ||
      a.subRole?.toLowerCase().includes(search.toLowerCase())
  );

  const totalAdmins = admins.filter((a) => !isSuperAdminRole(a.role)).length;

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="w-full min-h-0"
    >
      <AdminPage
        eyebrow="Super Admin"
        title="Super admin console"
        description="Manage admin access and monitor privileged operations."
        actions={
          <div className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-[#D4AF37]">
            {currentUser?.name || currentUser?.email}
          </div>
        }
      >
        <motion.div
          className="grid grid-cols-2 gap-4 lg:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {[
            { label: "Total Admins", value: totalAdmins, hint: "Excluding super admin" },
            { label: "Active", value: activeAdmins.length, hint: "Can log in" },
            { label: "Inactive", value: inactiveAdmins.length, hint: "Access revoked" },
            { label: "Log Entries", value: activityLogs.length, hint: "Recent operations" },
          ].map((card) => (
            <motion.div
              key={card.label}
              variants={itemVariants}
              whileHover={{ y: -3, borderColor: "rgba(212,175,55,0.35)" }}
              transition={{ duration: 0.2 }}
              className="admin-stat-card rounded-[28px] border border-white/10 bg-white/[0.03] p-5"
            >
              <p className="admin-stat-label">{card.label}</p>
              <p className="admin-stat-value mt-2 text-3xl font-semibold text-white">
                <AnimatedNumber value={card.value} />
              </p>
              {card.hint ? <p className="admin-stat-hint mt-1 text-xs text-gray-500">{card.hint}</p> : null}
            </motion.div>
          ))}
        </motion.div>

        <AdminPanel className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-8 border-b border-white/10">
              {[
                { key: TAB.ADMINS, label: "Admin Accounts" },
                { key: TAB.LOGS, label: "Activity Log" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`relative pb-3 text-sm font-semibold transition-colors ${
                    tab === key ? "text-white" : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {label}
                  {tab === key ? (
                    <motion.div
                      layoutId="superadmin-tab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  ) : null}
                </button>
              ))}
            </div>

            {tab === TAB.ADMINS ? (
              <div className="flex flex-wrap gap-3">
                <div className="relative min-w-[200px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search admins…"
                    className="w-full min-w-[200px] rounded-2xl border border-white/10 bg-black/60 py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  onClick={() => setCreateOpen(true)}
                  className="rounded-full bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-black hover:bg-[#c99d2f]"
                >
                  + New Admin
                </motion.button>
              </div>
            ) : null}
          </div>

          {tab === TAB.ADMINS ? (
            <>
              {adminsLoading ? (
                <div className="mt-6">
                  <SkeletonGrid count={4} className="grid gap-4 md:grid-cols-2" />
                </div>
              ) : null}
              {adminsError ? (
                <div className="py-10 text-center text-sm text-red-400">{adminsError}</div>
              ) : null}
              {!adminsLoading && !adminsError ? (
                <AdminTable admins={filteredAdmins} currentUserId={currentUser?._id} />
              ) : null}
            </>
          ) : (
            <ActivityLogTable />
          )}
        </AdminPanel>

        <CreateAdminModal isOpen={isCreateOpen} onClose={() => setCreateOpen(false)} />
      </AdminPage>
    </motion.div>
  );
};

export default SuperAdminDashboard;
