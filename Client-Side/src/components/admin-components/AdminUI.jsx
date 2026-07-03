import React from "react";
import usePageMeta from "@/hooks/use-page-meta";

export const AdminPage = ({ title, description, eyebrow, actions, children }) => {
  usePageMeta({ title: "Admin" });

  return (
    <div className="admin-page-shell">
      <div className="admin-page-header">
        <div>
          {eyebrow ? <p className="admin-page-eyebrow">{eyebrow}</p> : null}
          <h1 className="admin-page-title">{title}</h1>
          {description ? <p className="admin-page-description">{description}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
};

export const AdminPanel = ({ title, description, children, className = "" }) => {
  return (
    <section className={`admin-panel ${className}`.trim()}>
      {title ? <h2 className="admin-panel-title">{title}</h2> : null}
      {description ? <p className="admin-panel-description">{description}</p> : null}
      <div className={title || description ? "mt-5" : ""}>{children}</div>
    </section>
  );
};

export const AdminStatCard = ({ label, value, hint, icon }) => {
  const Icon = icon;

  return (
    <div className="admin-stat-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="admin-stat-label">{label}</p>
          <p className="admin-stat-value">{value}</p>
          {hint ? <p className="admin-stat-hint">{hint}</p> : null}
        </div>
        {Icon ? (
          <div className="rounded-xl border border-ink/10 bg-black/40 p-2.5">
            <Icon className="h-5 w-5 text-gold-ink2" />
          </div>
        ) : null}
      </div>
    </div>
  );
};

