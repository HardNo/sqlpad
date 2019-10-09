const db = require('../lib/db.js');
const Joi = require('joi');

/*
"chartConfiguration": {
    "chartType": "line",
    "fields": {
        "x": "created_month",
        "y": "package_count",
        "split": "keyword",
        "xFacet": "",
        "yFacet": "keyword",
        "trendline": "true"
    }
}
*/

const schema = {
  _id: Joi.string().optional(), // generated by nedb
  name: Joi.string().required(),
  tags: Joi.array()
    .items(Joi.string().empty(''))
    .sparse()
    .optional(),
  connectionId: Joi.string()
    .optional()
    .empty(''),
  queryText: Joi.string()
    .optional()
    .empty(''),
  chartConfiguration: Joi.object({
    chartType: Joi.string()
      .optional()
      .empty(''),
    // key value pairings. key=chart property, value=field mapped to property
    fields: Joi.object()
      .unknown(true)
      .optional()
  }).optional(),
  createdDate: Joi.date().default(new Date(), 'time of creation'),
  modifiedDate: Joi.date().default(new Date(), 'time of modification'),
  createdBy: Joi.string().required(),
  modifiedBy: Joi.string().required(),
  lastAccessDate: Joi.date().default(new Date(), 'time of last access')
};

function findOneById(id) {
  return db.queries.findOne({ _id: id });
}

function findAll() {
  return db.queries.find({});
}

function findByFilter(filter) {
  return db.queries.find(filter);
}

function removeById(id) {
  return db.queries.remove({ _id: id });
}

/**
 * Save query object
 * returns saved query object
 * @param {object} query
 */
async function save(query) {
  query.modifiedDate = new Date();
  query.lastAccessDate = new Date();

  // clean tags if present
  // sqlpad v1 saved a lot of bad inputs
  if (Array.isArray(query.tags)) {
    query.tags = query.tags
      .filter(tag => {
        return typeof tag === 'string' && tag.trim() !== '';
      })
      .map(tag => {
        return tag.trim();
      });
  }
  const joiResult = Joi.validate(query, schema);
  if (joiResult.error) {
    return Promise.reject(joiResult.error);
  }
  if (query._id) {
    await db.queries.update({ _id: query._id }, joiResult.value, {
      upsert: true
    });
    return findOneById(query._id);
  }
  const newQuery = await db.queries.insert(joiResult.value);
  return newQuery;
}

module.exports = {
  findOneById,
  findAll,
  findByFilter,
  removeById,
  save
};
