import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdmins, fetchActivityLogs } from "../../store/admin/super-admin-slice";
import AdminTable from "./AdminTable";
import ActivityLogTable from "./ActivityLogTable";
import CreateAdminModal from "./CreateAdminModal";
import { AdminPage, AdminStatCard, AdminPanel } from "@/components/admin-components/AdminUI";

const TAB = { ADMINS: "admins", LOGS: "logs" };

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
    (a) => a.isActive && a.role !== "super_admin"
  );
  const inactiveAdmins = admins.filter(
    (a) => !a.isActive && a.role !== "super_admin"
  );

  const filteredAdmins = admins.filter(
    (a) =>
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
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
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <AdminStatCard label="Total Admins" value={admins.filter((a) => a.role !== "super_admin").length} />
        <AdminStatCard label="Active" value={activeAdmins.length} hint="Can log in" />
        <AdminStatCard label="Inactive" value={inactiveAdmins.length} hint="Access revoked" />
        <AdminStatCard label="Log Entries" value={activityLogs.length} hint="Recent operations" />
      </div>

      <AdminPanel className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-1 rounded-xl border border-white/10 bg-black p-1">
            {[
              { key: TAB.ADMINS, label: "Admin Accounts" },
              { key: TAB.LOGS, label: "Activity Log" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-5 py-2 text-sm font-medium rounded-lg transition-all
                  ${
                    tab === key
                      ? "bg-[#D4AF37] text-black shadow-sm"
                      : "text-gray-400 hover:text-white"
                  }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === TAB.ADMINS && (
            <div className="flex gap-3">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search admins…"
                className="w-48 rounded-xl border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#D4AF37]"
              />
              <button
                onClick={() => setCreateOpen(true)}
                className="rounded-xl bg-[#D4AF37] px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-[#c99d2f]"
              >
                + New Admin
              </button>
            </div>
          )}
        </div>

        {tab === TAB.ADMINS && (
          <>
            {adminsLoading && (
              <div className="py-16 text-center text-sm text-gray-400 animate-pulse">
                Loading admins…
              </div>
            )}
            {adminsError && (
              <div className="py-10 text-center text-sm text-red-400">
                {adminsError}
              </div>
            )}
            {!adminsLoading && !adminsError && (
              <AdminTable
                admins={filteredAdmins}
                currentUserId={currentUser?._id}
              />
            )}
          </>
        )}

        {tab === TAB.LOGS && <ActivityLogTable />}
      </AdminPanel>

      <CreateAdminModal
        isOpen={isCreateOpen}
        onClose={() => setCreateOpen(false)}
      />
    </AdminPage>
  );
};

export default SuperAdminDashboard;