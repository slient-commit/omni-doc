'use strict';

// ponytail: check per-item permission flags — item creator always allowed
function checkItemPermission(item, userId, action) {
  if (item.createdById === userId) return; // owner always allowed
  const flag = `allow${action.charAt(0).toUpperCase() + action.slice(1)}`;
  if (item[flag] === false) {
    const err = new Error(`${action} is not allowed on this item`);
    err.status = 403;
    throw err;
  }
}

module.exports = { checkItemPermission };
