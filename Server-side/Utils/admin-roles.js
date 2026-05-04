/**
 * Centralised admin role helpers.
 *
 * Every file that needs to decide "is this user an admin?" should import
 * from here so the list of admin roles is maintained in exactly one place.
 */

const ADMIN_ROLES = Object.freeze(["admin", "super_admin", "superadmin"]);

/**
 * @param {string} role
 * @returns {boolean}
 */
const isAdminRole = (role) => ADMIN_ROLES.includes(String(role || "").toLowerCase());

module.exports = { ADMIN_ROLES, isAdminRole };
