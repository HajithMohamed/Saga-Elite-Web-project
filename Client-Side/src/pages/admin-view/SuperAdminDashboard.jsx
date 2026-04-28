import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdmins, fetchActivityLogs } from "../../store/admin/super-admin-slice";
import AdminTable from "./AdminTable";
import ActivityLogTable from "./ActivityLogTable";
import CreateAdminModal from "./CreateAdminModal";

const TAB = { ADMINS: "admins", LOGS: "logs" };

const StatCard = ({ label, value, sub }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5">
    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
      {label}
    </p>
    <p className="text-3xl font-semibold text-gray-900">{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

const SuperAdminDashboard = () => {
  const dispatch = useDispatch();
  const { admins, adminsLoading, adminsError, activityLogs, logsLoading } =
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
    <div className="min-h-screen bg-gray-50 flex flex-col w-full">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Super Admin Console
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Manage admin accounts and monitor system activity
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:block">
              {currentUser?.name || currentUser?.email}
            </span>
            <span className="text-xs bg-gray-900 text-white px-2.5 py-1 rounded-full font-medium">
              Super Admin
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8 flex-1">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Admins"
            value={admins.filter((a) => a.role !== "super_admin").length}
          />
          <StatCard
            label="Active"
            value={activeAdmins.length}
            sub="Can log in"
          />
          <StatCard
            label="Inactive"
            value={inactiveAdmins.length}
            sub="Access revoked"
          />
          <StatCard
            label="Log Entries"
            value={activityLogs.length}
            sub="Recent operations"
          />
        </div>

        {/* Tabs + actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
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
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
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
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none
                  focus:border-black bg-white w-48 transition-colors"
              />
              <button
                onClick={() => setCreateOpen(true)}
                className="px-4 py-2 text-sm font-medium bg-black text-white rounded-xl
                  hover:bg-gray-800 transition-colors"
              >
                + New Admin
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        {tab === TAB.ADMINS && (
          <>
            {adminsLoading && (
              <div className="text-center py-16 text-gray-400 text-sm animate-pulse">
                Loading admins…
              </div>
            )}
            {adminsError && (
              <div className="text-center py-10 text-red-500 text-sm">
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
      </div>

      {/* Modal */}
      <CreateAdminModal
        isOpen={isCreateOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
};

export default SuperAdminDashboard;