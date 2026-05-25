const ROLE = {
    ADMIN: 'admin',
    MEMBER: 'member',
    BANNED: 'banned',
    REQUESTING: 'requesting',
};

const LEGACY_ROLE_MAP = {
    1: ROLE.ADMIN,
    2: ROLE.MEMBER,
    3: ROLE.BANNED,
    4: ROLE.REQUESTING,
};

const normalizeRole = role => LEGACY_ROLE_MAP[role] || role;

const hasRole = (alumet, userId, roles = []) => {
    if (!userId || !alumet) {
        return false;
    }

    if (alumet.owner === userId) {
        return true;
    }

    return alumet.participants.some(participant => participant.userId === userId && roles.includes(normalizeRole(participant.role || participant.status)));
};

const canAccessAlumet = (alumet, userId) => {
    if (!userId || !alumet) {
        return false;
    }

    return alumet.owner === userId || alumet.participants.some(participant => participant.userId === userId && [ROLE.ADMIN, ROLE.MEMBER].includes(normalizeRole(participant.role || participant.status)));
};

const canAdminAlumet = (alumet, userId) => hasRole(alumet, userId, [ROLE.ADMIN]);

const participantRole = participant => normalizeRole(participant.role || participant.status || ROLE.MEMBER);

module.exports = { ROLE, normalizeRole, hasRole, canAccessAlumet, canAdminAlumet, participantRole };
