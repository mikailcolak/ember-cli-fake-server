/* globals jQuery */
import RSVP from 'rsvp';

export default (url, options) => RSVP.cast(jQuery.ajax(url, options)).catch(() => null);
