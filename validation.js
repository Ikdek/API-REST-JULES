const Joi = require("joi");
const { ROLES } = require("./perm");

const MESSAGES = {
  "any.required": "{#label} est requis",
  "any.only": "{#label} doit être l'une des valeurs suivantes : {#valids}",
  "any.invalid": "{#label} contient une valeur interdite",
  "string.base": "{#label} doit être une chaîne de caractères",
  "string.empty": "{#label} ne peut pas être vide",
  "string.min": "{#label} doit contenir au moins {#limit} caractères",
  "string.max": "{#label} doit contenir au plus {#limit} caractères",
  "string.pattern.base": "{#label} ne peut contenir que des lettres, chiffres, '.', '_' ou '-'",
  "number.base": "{#label} doit être un nombre",
  "number.integer": "{#label} doit être un entier",
  "number.positive": "{#label} doit être strictement positif",
  "object.base": "Le corps de la requête doit être un objet JSON",
  "object.unknown": "{#label} n'est pas un champ autorisé",
  "object.min": "Aucun champ à modifier",
};

const id = Joi.number().integer().positive();

const username = Joi.string().trim().min(3).max(30).pattern(/^[a-zA-Z0-9._-]+$/);
const password = Joi.string().min(8).max(128);

const productName = Joi.string().trim().min(1).max(100);
const productDescription = Joi.string().trim().max(1000).allow("", null);
const productCategory = Joi.string().trim().max(50).allow("", null);

const schemas = {
  idParam: Joi.object({
    id: id.required(),
  }),

  productQuery: Joi.object({
    id: id,
  }),

  register: Joi.object({
    username: username.required(),
    password: password.required(),
  }),

  login: Joi.object({
    username: Joi.string().max(30).required(),
    password: Joi.string().max(128).required(),
  }),

  role: Joi.object({
    role: Joi.string().valid(...Object.values(ROLES)).required(),
  }),

  productCreate: Joi.object({
    name: productName.required(),
    description: productDescription,
    category: productCategory,
  }),

  productUpdate: Joi.object({
    name: productName,
    description: productDescription,
    category: productCategory,
  }).min(1),
};

function validate(schema, source = "body") {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source] || {}, {
      abortEarly: false,
      messages: MESSAGES,
      errors: { wrap: { label: "'" } },
    });

    if (error) {
      return res.status(400).json({
        error: "Données invalides",
        details: error.details.map((detail) => ({
          field: detail.path.join("."),
          message: detail.message,
        })),
      });
    }
    Object.defineProperty(req, source, { value, writable: true, enumerable: true, configurable: true });
    next();
  };
}

module.exports = { schemas, validate };
