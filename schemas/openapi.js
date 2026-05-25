const { OpenAPIRegistry, OpenApiGeneratorV3, extendZodWithOpenApi } = require('@asteasolutions/zod-to-openapi');
const { z } = require('./common');

extendZodWithOpenApi(z);

const schemas = require('./api');

const registry = new OpenAPIRegistry();

const errorResponse = z.object({
    error: z.string(),
    code: z.string(),
});

registry.register('ApiError', errorResponse);
registry.register('CreateSessionBody', schemas.createSession.shape.body);
registry.register('CreateAccountBody', schemas.createAccount.shape.body);
registry.register('CreateAlumetBody', schemas.createAlumet.shape.body);
registry.register('InvitationPatchBody', schemas.invitationPatch.shape.body);

const jsonResponse = description => ({
    description,
    content: {
        'application/json': {
            schema: z.object({}).passthrough(),
        },
    },
});

const addRoute = (method, path, summary) => {
    registry.registerPath({
        method,
        path,
        summary,
        responses: {
            200: jsonResponse('Success'),
            400: jsonResponse('Bad request'),
            403: jsonResponse('Forbidden'),
            404: jsonResponse('Not found'),
            422: jsonResponse('Validation error'),
        },
    });
};

[
    ['get', '/api/csrf-token', 'Get CSRF token'],
    ['post', '/api/sessions', 'Create session'],
    ['delete', '/api/sessions/current', 'Delete current session'],
    ['post', '/api/accounts', 'Create account'],
    ['get', '/api/me', 'Get current user dashboard'],
    ['patch', '/api/me', 'Update current user'],
    ['patch', '/api/me/avatar', 'Update current user avatar'],
    ['patch', '/api/me/2fa', 'Toggle current user 2FA'],
    ['get', '/api/alumets/{id}', 'Get Alumet metadata'],
    ['get', '/api/alumets/{id}/content', 'Get Alumet content'],
    ['post', '/api/alumets', 'Create Alumet-compatible application'],
    ['patch', '/api/alumets/{id}', 'Update Alumet-compatible application'],
    ['delete', '/api/alumets/{id}', 'Delete Alumet-compatible application'],
    ['post', '/api/alumets/{id}/access-grants', 'Grant or request Alumet access'],
    ['delete', '/api/alumets/{id}/members/me', 'Leave Alumet'],
    ['patch', '/api/alumets/{id}/members/{userId}', 'Update Alumet member role'],
    ['patch', '/api/alumets/{id}/owner', 'Transfer Alumet ownership'],
    ['post', '/api/alumets/{alumetId}/walls', 'Create Alumet wall'],
    ['patch', '/api/alumets/{alumetId}/walls/{wallId}', 'Update Alumet wall'],
    ['patch', '/api/alumets/{alumetId}/walls/{wallId}/position', 'Move Alumet wall'],
    ['delete', '/api/alumets/{alumetId}/walls/{wallId}', 'Delete Alumet wall'],
    ['post', '/api/alumets/{alumetId}/walls/{wallId}/posts', 'Create Alumet post'],
    ['patch', '/api/alumets/{alumetId}/posts/{postId}', 'Update Alumet post'],
    ['patch', '/api/alumets/{alumetId}/walls/{wallId}/posts/{postId}/position', 'Move Alumet post'],
    ['delete', '/api/alumets/{alumetId}/posts/{postId}', 'Delete Alumet post'],
    ['get', '/api/alumets/{alumetId}/posts/{postId}/comments', 'List Alumet post comments'],
    ['post', '/api/alumets/{alumetId}/posts/{postId}/comments', 'Create Alumet post comment'],
    ['get', '/api/flashcard-sets/{id}', 'Get flashcard set'],
    ['get', '/api/flashcard-sets/{id}/cards', 'Get flashcard set cards'],
    ['put', '/api/flashcard-sets/{id}/cards', 'Replace flashcard set cards'],
    ['post', '/api/flashcard-sets/{id}/imports', 'Import flashcards'],
    ['get', '/api/flashcard-sets/{id}/review-availability', 'Get flashcard review availability'],
    ['post', '/api/flashcard-sets/{id}/cards/{cardId}/reviews', 'Create flashcard review'],
    ['delete', '/api/flashcard-sets/{id}/cards/{cardId}', 'Delete flashcard'],
    ['delete', '/api/flashcard-sets/{id}/progress/me', 'Reset my flashcard progress'],
    ['post', '/api/flashcard-generations', 'Generate flashcards'],
    ['get', '/api/files', 'List files'],
    ['post', '/api/files', 'Upload file'],
    ['get', '/api/files/{id}', 'Get file metadata'],
    ['patch', '/api/files/{id}', 'Update file'],
    ['delete', '/api/files/{id}', 'Delete file'],
    ['get', '/api/files/{id}/preview', 'Get file preview'],
    ['get', '/api/files/{id}/content', 'Get file content'],
    ['get', '/api/files/{id}/download', 'Download file'],
    ['get', '/api/folders', 'List folders'],
    ['post', '/api/folders', 'Create folder'],
    ['patch', '/api/folders/{id}', 'Update folder'],
    ['delete', '/api/folders/{id}', 'Delete folder'],
    ['get', '/api/invitations/{id}', 'Get invitation'],
    ['patch', '/api/invitations/{id}', 'Update invitation'],
    ['get', '/api/users/search', 'Search users'],
    ['get', '/api/admin/incidents', 'List incidents'],
    ['post', '/api/admin/incidents', 'Create incident'],
    ['patch', '/api/admin/users/{userId}/suspension', 'Suspend user'],
    ['delete', '/api/admin/users/{userId}/suspension', 'Unsuspend user'],
    ['post', '/api/billing/checkout-sessions', 'Create checkout session'],
    ['post', '/api/billing/portal-sessions', 'Create billing portal session'],
    ['post', '/api/billing/webhook', 'Stripe webhook'],
    ['get', '/api/link-metadata', 'Get link metadata'],
    ['post', '/api/chat/conversations', 'Create chat conversation'],
    ['post', '/api/chat/conversations/{id}/messages', 'Create chat message'],
    ['delete', '/api/chat/messages/{id}', 'Delete chat message'],
].forEach(([method, path, summary]) => addRoute(method, path, summary));

const generateOpenApiDocument = () => {
    const generator = new OpenApiGeneratorV3(registry.definitions);
    return generator.generateDocument({
        openapi: '3.0.0',
        info: {
            title: 'Alumet API',
            version: '1.0.0',
        },
    });
};

module.exports = { generateOpenApiDocument };
