// roles.js
export const ROLES = {
  ADMIN:     'admin',
  MODERATOR: 'moderator',
  USER:      'user',
  GUEST:     'guest'
};

export const PERMISSIONS = {
  // ─── Posts ───────────────────────────────────────────
  'post:view':          [ROLES.GUEST, ROLES.USER, ROLES.MODERATOR, ROLES.ADMIN],
  'post:create':        [ROLES.USER,  ROLES.MODERATOR, ROLES.ADMIN],
  'post:edit-own':      [ROLES.USER,  ROLES.MODERATOR, ROLES.ADMIN],
  'post:delete-own':    [ROLES.USER,  ROLES.MODERATOR, ROLES.ADMIN],
  'post:edit-any':      [ROLES.MODERATOR, ROLES.ADMIN],
  'post:delete-any':    [ROLES.MODERATOR, ROLES.ADMIN],
  'post:pin':           [ROLES.MODERATOR, ROLES.ADMIN],

  // ─── Comments ─────────────────────────────────────────
  'comment:view':       [ROLES.GUEST, ROLES.USER, ROLES.MODERATOR, ROLES.ADMIN],
  'comment:create':     [ROLES.USER,  ROLES.MODERATOR, ROLES.ADMIN],
  'comment:edit-own':   [ROLES.USER,  ROLES.MODERATOR, ROLES.ADMIN],
  'comment:delete-own': [ROLES.USER,  ROLES.MODERATOR, ROLES.ADMIN],
  'comment:delete-any': [ROLES.MODERATOR, ROLES.ADMIN],

  // ─── Profile ──────────────────────────────────────────
  'profile:delete-own': [ROLES.USER,  ROLES.MODERATOR, ROLES.ADMIN],
  'profile:edit-own':   [ROLES.USER,  ROLES.MODERATOR, ROLES.ADMIN],
  'profile:edit-any':   [ROLES.ADMIN],

  // ─── Likes / Reactions ────────────────────────────────
  'like:create':        [ROLES.USER,  ROLES.MODERATOR, ROLES.ADMIN],
  'like:remove':        [ROLES.USER,  ROLES.MODERATOR, ROLES.ADMIN],

  // ─── Follow / Friends ─────────────────────────────────
  'follow:create':      [ROLES.USER,  ROLES.MODERATOR, ROLES.ADMIN],
  'follow:remove':      [ROLES.USER,  ROLES.MODERATOR, ROLES.ADMIN],

  // ─── Messaging ────────────────────────────────────────
  'message:send':       [ROLES.USER,  ROLES.MODERATOR, ROLES.ADMIN],
  'message:delete-own': [ROLES.USER,  ROLES.MODERATOR, ROLES.ADMIN],
  'message:view-any':   [ROLES.ADMIN],

  // ─── Moderation ───────────────────────────────────────
  'user:warn':          [ROLES.MODERATOR, ROLES.ADMIN],
  'user:mute':          [ROLES.MODERATOR, ROLES.ADMIN],
  'user:ban':           [ROLES.MODERATOR, ROLES.ADMIN],
  'user:unban':         [ROLES.MODERATOR, ROLES.ADMIN],
  'report:view':        [ROLES.MODERATOR, ROLES.ADMIN],
  'report:resolve':     [ROLES.MODERATOR, ROLES.ADMIN],

  // ─── User Management ──────────────────────────────────
  'user:view-all':      [ROLES.ADMIN],
  'user:delete':        [ROLES.ADMIN],
  'user:role-assign':   [ROLES.ADMIN],

  // ─── Admin ────────────────────────────────────────────
  'admin:dashboard':    [ROLES.ADMIN],
  'admin:audit-logs':   [ROLES.ADMIN],
  'admin:settings':     [ROLES.ADMIN],
};
