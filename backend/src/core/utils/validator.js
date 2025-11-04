/**
 * Joi validation middleware
 */
const validate = (schema) => {
  return (req, res, next) => {
    const validationOptions = {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true
    };

    // Validate request parts based on schema
    const toValidate = {};
    if (schema.body) toValidate.body = req.body;
    if (schema.params) toValidate.params = req.params;
    if (schema.query) toValidate.query = req.query;

    const { error, value } = Object.keys(toValidate).reduce((acc, key) => {
      const { error, value } = schema[key].validate(toValidate[key], validationOptions);
      if (error) acc.error = error;
      if (value) acc.value = { ...acc.value, [key]: value };
      return acc;
    }, { error: null, value: {} });

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    // Replace request data with validated and sanitized data
    if (value.body) req.body = value.body;
    if (value.params) req.params = value.params;
    if (value.query) req.query = value.query;

    next();
  };
};

module.exports = { validate };

