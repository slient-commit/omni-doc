'use strict';

const { validationResult } = require('express-validator');

function validate(validations) {
  return [
    ...validations,
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({
          error: {
            message: 'Validation failed',
            details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
          },
        });
      }
      next();
    },
  ];
}

module.exports = { validate };
