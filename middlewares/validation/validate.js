const { ZodError } = require('zod');
const { sendApiError } = require('../../utils/errors');

const formatIssues = issues => issues.map(issue => `${issue.path.join('.') || 'body'}: ${issue.message}`).join('; ');

const validate = schema => (req, res, next) => {
    const parsed = schema.safeParse({
        body: req.body,
        params: req.params,
        query: req.query,
    });

    if (!parsed.success) {
        return sendApiError(res, 422, formatIssues(parsed.error.issues), 'VALIDATION_ERROR');
    }

    req.validated = parsed.data;
    return next();
};

const validateData = (schema, data) => {
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
        throw parsed.error;
    }
    return parsed.data;
};

const zodErrorMessage = error => (error instanceof ZodError ? formatIssues(error.issues) : error.message);

module.exports = { validate, validateData, zodErrorMessage };
