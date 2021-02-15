// For audit logging of guac transfers

const Joi = require('@hapi/joi');

const eventTypes = [
  'lost-bet',
  'won-bet',
  'sentiment',
  'gift',
  'steal',
  'steal-fail'
  'won-lottery',
];

const schema = Joi.object({
  // slack user id. There are special reserved strings for both these fields for
  // things like sentiment bot, the shared pot, etc for facilitating transfers
  // between non-users and users. The GuacEvent#isReservedID method checks if a
  // string is a reserved identifier.
  to:      Joi.string().required(), 
  from:    Joi.string().required(),

  // Amounts should always be positive. If a user is losing guac, that user's id
  // should be used for the 'from' field. If the user loses guac because of some
  // non-user-to-user event like a lost bet, one of the reserved identifiers
  // should be used for the 'to' field. The idea is that if you lose money in a
  // bet, the dealer takes your money.
  amount:  Joi.number().min( 0 ).required(),
  time:    Joi.number().required(),
  updated: Joi.date().required(),
  type:    Joi.string().valid( ...eventTypes )
});

module.exports = class GuacEvent {

  constructor( evt ) {
    this.data = this.validate({ ...evt, updated: new Date() });

    // strings for identifying non-users
    this.reserved = [
      'sentiment', // sentiment bot
      'shared'     // shared pot
    ];
  }

  static isReservedID( s ) {
    return this.reserved.includes( s );
  }

  /**
   * Confirms that metadata is of the expected shape using the Joi schema
   * above.
   *
   * @param {Object} evt
   * @throws Will throw when Joi.validate fails
   */
  validate( evt ) {
    const { value, error } = schema.validate( evt );

    if ( error ) {
      throw `
      Problem creating GuacEvent
      ${ error }
      Data: ${ JSON.stringify( evt, null, 2 ) }
      `;
    }

    return value;
  }

}

