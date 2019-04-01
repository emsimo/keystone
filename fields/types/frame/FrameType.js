var FieldType = require('../Type');
var Path = require('../../../lib/path');
var util = require('util');
var utils = require('keystone-utils');

/**
 * Frame FieldType Constructor
 * @extends Field
 * @api public
 */
function frame(list, path, options) {
	// Set field properties and options
	this._properties = ['urlPrefix'];
	this.urlPrefix =  options.urlPrefix ;
	this.list = list;
	this._path = new Path(path);
	this.path = path;

	this.type = this.constructor.name;
	this.label = options.label || utils.keyToLabel(this.path);
	this.typeDescription = options.typeDescription || this.typeDescription || this.type;


	this.options = { nocol: true, col: false, nofilter: true};
}
frame.properName = 'Frame';

util.inherits(frame, FieldType);


/* Export Field Type */
module.exports = frame;
