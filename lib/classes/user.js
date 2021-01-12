const Joi = require('@hapi/joi');

const schema = Joi.object({
  // slack is the data received from the slack api 
  slack: Joi.object({
    color:               Joi.string(),
    deleted:             Joi.boolean(),
    has_2fa:             Joi.boolean(),
    id:                  Joi.string(),
    is_admin:            Joi.boolean(),
    is_app_user:         Joi.boolean(),
    is_bot:              Joi.boolean(),
    is_owner:            Joi.boolean(),
    is_primary_owner:    Joi.boolean(),
    is_restricted:       Joi.boolean(),
    is_ultra_restricted: Joi.boolean(),
    name:                Joi.string(),
    profile:             Joi.object(),
    real_name:           Joi.string(),
    team_id:             Joi.string(),
    tz:                  Joi.string(),
    tz_label:            Joi.string(),
    tz_offset:           Joi.number(),
  }),
  guac_total: Joi.number().default( 10e4 ),
  guac_given: Joi.number().default( 0 ),
  guac_rcvd:  Joi.number().default( 0 ),
  updated:    Joi.date().required()
});

module.exports = class User {

  constructor( user ) {
    this.data = this.validate({ ...user, updated: new Date() });
  }

  /**
   * Confirms that a user is of the expected shape using the Joi schema
   * above.
   *
   * @param {Object} user
   * @throws Will throw when Joi.validate fails
   */
  validate( user ) {
    const opts = { allowUnknown: true };
    const { value, error } = schema.validate( user, opts );

    if ( error ) {
      throw `
      Problem creating User
      ${ error }
      Data: ${ JSON.stringify( user, null, 2 ) }
      `;
    }

    return value;
  }

}

