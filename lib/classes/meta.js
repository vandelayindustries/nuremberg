const Joi = require('@hapi/joi');

const schema = Joi.object({
  user:      Joi.string().required(),
  sentiment: Joi.number().required(),
  msgCount:  Joi.number().required(),
  mentions:  Joi.number().required(), // name-drops by this user
  mentioned: Joi.number().required(), // number of times this user was mentioned
  start:     Joi.date().required(),
  end:       Joi.date().required(),
  updated:   Joi.date().required()
});

module.exports = class Meta {

  constructor( meta ) {
    this.data = this.validate({ ...meta, updated: new Date() });
  }

  /**
   * Confirms that metadata is of the expected shape using the Joi schema
   * above.
   *
   * @param {Object} meta
   * @throws Will throw when Joi.validate fails
   */
  validate( meta ) {
    const { value, error } = schema.validate( meta );

    if ( error ) {
      throw `
      Problem creating Metadata
      ${ error }
      Data: ${ JSON.stringify( meta, null, 2 ) }
      `;
    }

    return value;
  }

}

