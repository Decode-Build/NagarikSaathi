const { z } = require('zod');

const citizenProfileSchema = z.object({
  phone: z.string().min(10).max(15),
  name: z.string().optional(),
  age: z.number().int().min(0).max(120),
  income: z.number().min(0),
  state: z.string(),
  category: z.string().optional(),
  occupation: z.string().optional(),
});

const validateEligibilityCheck = (req, res, next) => {
  const result = citizenProfileSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid profile data',
      errors: result.error.format()
    });
  }
  req.validatedBody = result.data;
  next();
};

module.exports = { validateEligibilityCheck };
