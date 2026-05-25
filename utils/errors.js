class ApiError extends Error {
    constructor(status, message, code = 'API_ERROR') {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
    }
}

const errorCodeFromStatus = status => {
    switch (status) {
        case 400:
            return 'BAD_REQUEST';
        case 401:
            return 'UNAUTHORIZED';
        case 403:
            return 'FORBIDDEN';
        case 404:
            return 'NOT_FOUND';
        case 409:
            return 'CONFLICT';
        case 422:
            return 'VALIDATION_ERROR';
        case 429:
            return 'RATE_LIMITED';
        default:
            return 'SERVER_ERROR';
    }
};

const sendApiError = (res, status, message, code) => res.status(status).json({ error: message, code: code || errorCodeFromStatus(status) });

const normalizeApiError = error => {
    if (error instanceof ApiError) {
        return error;
    }

    if (error?.code === 'EBADCSRFTOKEN') {
        return new ApiError(403, 'Invalid CSRF token.', 'INVALID_CSRF_TOKEN');
    }

    if (error?.status || error?.statusCode) {
        const status = error.status || error.statusCode;
        return new ApiError(status, error.message || 'Request failed', error.code || errorCodeFromStatus(status));
    }

    return new ApiError(500, error?.message || 'Server error', 'SERVER_ERROR');
};

module.exports = { ApiError, sendApiError, normalizeApiError, errorCodeFromStatus };
