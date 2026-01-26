import Joi from 'joi';

export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Validation failed',
        errors
      });
    }

    next();
  };
};

export const syncUserSchema = Joi.object({
  clerkUserId: Joi.string().required(),
  email: Joi.string().email().required(),
  fullName: Joi.string().max(255).optional()
});

export const updatePreferencesSchema = Joi.object({
  preferences: Joi.object().required()
});

export const createProjectSchema = Joi.object({
  title: Joi.string().max(500).optional(),
  wordGoal: Joi.number().min(1000).optional(),
  treeStyle: Joi.string().valid('oak', 'willow', 'pine', 'maple', 'cherry').optional(),
  treeSeason: Joi.string().valid('spring', 'summer', 'autumn', 'winter').optional()
});

export const updateProjectSchema = Joi.object({
  title: Joi.string().max(500).optional(),
  wordGoal: Joi.number().min(1000).optional(),
  status: Joi.string().valid('active', 'completed', 'archived').optional(),
  treeStyle: Joi.string().valid('oak', 'willow', 'pine', 'maple', 'cherry').optional(),
  treeSeason: Joi.string().valid('spring', 'summer', 'autumn', 'winter').optional()
});

export const updateContentSchema = Joi.object({
  content: Joi.string().required(),
  wordCount: Joi.number().min(0).required(),
  characterCount: Joi.number().min(0).required(),
  cursorPosition: Joi.number().min(0).optional()
});
