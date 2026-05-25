const { z, objectId, role, appType, reviewMode } = require('./common');

const schemas = {
    createSession: z.object({
        body: z.object({
            mail: z.string().email(),
            password: z.string().min(1),
        }),
    }),
    createAccount: z.object({
        body: z.object({
            name: z.string().min(2),
            lastname: z.string().min(2),
            mail: z.string().email(),
            password: z.string().min(6),
            accountType: z.enum(['student', 'professor']),
        }),
    }),
    twoFactorCode: z.object({
        body: z.object({
            mail: z.string().email().optional(),
        }).passthrough(),
    }),
    twoFactorVerification: z.object({
        body: z.object({
            mail: z.string().email(),
            code: z.string().min(4).max(10),
        }),
    }),
    passwordReset: z.object({
        body: z.object({
            mail: z.string().email(),
            password: z.string().min(6),
            code: z.string().min(4).max(10),
        }),
    }),
    updateMe: z.object({
        body: z.object({
            username: z.string().min(2).max(18),
        }).passthrough(),
    }),
    toggleTwoFactor: z.object({
        body: z.object({
            code: z.string().min(4).max(10),
        }),
    }),
    alumetId: z.object({
        params: z.object({ id: objectId }),
    }),
    createAlumet: z.object({
        body: z.object({
            title: z.string().min(2).max(150),
            description: z.string().max(2000).optional().or(z.literal('')),
            type: appType,
        }).passthrough(),
    }),
    updateMember: z.object({
        params: z.object({ id: objectId, userId: objectId }),
        body: z.object({ role }),
    }),
    updateOwner: z.object({
        params: z.object({ id: objectId }),
        body: z.object({ user: objectId }),
    }),
    wallParams: z.object({
        params: z.object({ alumetId: objectId, wallId: objectId }),
    }),
    createWall: z.object({
        params: z.object({ alumetId: objectId }),
        body: z.object({
            title: z.string().min(1),
            postAuthorized: z.coerce.boolean().optional(),
        }).passthrough(),
    }),
    updateWallPosition: z.object({
        params: z.object({ alumetId: objectId, wallId: objectId }),
        body: z.object({
            direction: z.enum(['left', 'right']).optional(),
        }).passthrough(),
        query: z.object({
            direction: z.enum(['left', 'right']).optional(),
        }).passthrough(),
    }),
    postParams: z.object({
        params: z.object({ alumetId: objectId, postId: objectId }),
    }),
    createPost: z.object({
        params: z.object({ alumetId: objectId, wallId: objectId }),
        body: z.object({
            title: z.string().min(1).max(200),
        }).passthrough(),
    }),
    movePost: z.object({
        params: z.object({ alumetId: objectId, wallId: objectId, postId: objectId }),
        body: z.object({
            position: z.coerce.number().int().min(0),
        }).passthrough(),
    }),
    createComment: z.object({
        params: z.object({ alumetId: objectId, postId: objectId }),
        body: z.object({
            content: z.string().min(1),
        }),
    }),
    flashcardSet: z.object({
        params: z.object({ id: objectId }),
    }),
    flashcardReview: z.object({
        params: z.object({ id: objectId, cardId: objectId }),
        body: z.object({
            status: z.coerce.number().int().min(0).max(3),
            cardReview: z.boolean().optional(),
        }).passthrough(),
    }),
    flashcardCardParams: z.object({
        params: z.object({ id: objectId, cardId: objectId }),
    }),
    flashcardReviewPage: z.object({
        params: z.object({ id: objectId, mode: reviewMode }),
    }),
    invitationPatch: z.object({
        params: z.object({ id: objectId }),
        body: z.object({
            status: z.enum(['accepted', 'declined']),
        }),
    }),
    folder: z.object({
        params: z.object({ id: objectId }),
    }),
    folderBody: z.object({
        body: z.object({
            name: z.string().min(1),
        }),
    }),
    file: z.object({
        params: z.object({ id: objectId }),
    }),
    filePatch: z.object({
        params: z.object({ id: objectId }),
        body: z.object({
            displayname: z.string().min(1),
        }),
    }),
    userSearch: z.object({
        query: z.object({
            q: z.string().min(2),
            type: z.enum(['student', 'professor']).optional(),
        }).passthrough(),
    }),
};

module.exports = schemas;
