import { renderNav, updateHeader } from "./common.js";

function initAdminDashboard() {
  renderNav({ activePath: "index.html", mode: "admin" });
  updateHeader();
}

document.addEventListener("DOMContentLoaded", initAdminDashboard);
