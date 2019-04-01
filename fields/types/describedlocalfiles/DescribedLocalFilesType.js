var _ = require('lodash');
var async = require('async');
var FieldType = require('../Type');
var fs = require('fs-extra');
var grappling = require('grappling-hook');
var keystone = require('../../../');
var moment = require('moment');
var path = require('path');
var util = require('util');
var utils = require('keystone-utils');

/**
 * describedlocalfiles FieldType Constructor
 * @extends Field
 * @api public
 */
function describedlocalfiles (list, path, options) {
	grappling.mixin(this).allowHooks('move');
	this._underscoreMethods = ['format', 'uploadFiles', 'remove'];
	this._fixedSize = 'full';

	// TODO: implement filtering, usage disabled for now
	options.nofilter = true;

	// TODO: implement initial form, usage disabled for now
	if (options.initial) {
		throw new Error('Invalid Configuration\n\n'
			+ 'describedlocalfiles fields (' + list.key + '.' + path + ') do not currently support being used as initial fields.\n');
	}

	if (options.overwrite !== false) {
		options.overwrite = true;
	}

	describedlocalfiles.super_.call(this, list, path, options);

	// validate destination dir
	if (!options.dest) {
		throw new Error('Invalid Configuration\n\n'
			+ 'describedlocalfiles fields (' + list.key + '.' + path + ') require the "dest" option to be set.');
	}

	// Allow hook into before and after
	if (options.pre && options.pre.move) {
		this.pre('move', options.pre.move);
	}

	if (options.post && options.post.move) {
		this.post('move', options.post.move);
	}
}
describedlocalfiles.properName = 'DescribedLocalFiles';
util.inherits(describedlocalfiles, FieldType);

/**
 * Registers the field on the List's Mongoose Schema.
 */
describedlocalfiles.prototype.addToSchema = function () {

	var field = this;
	var schema = this.list.schema;
	var mongoose = keystone.mongoose;

	var paths = this.paths = {

		// fields
		defaultSelected: this.path + '.defaultSelected',
		defaultSelectedIndex: this.path + '.defaultSelectedIndex',
		newfiles: this.path + '.newfiles',
		files: this.path + '.files',
		files_id: this.path + '.files.id',
		files_name: this.path + '.files.name',
		files_description: this.path + '.files.description',
		files_href: this.path + '.files.href',
		files_filename: this.path + '.files.filename',
		files_path: this.path + '.files.path',
		files_originalname: this.path + '.files.originalname',
		files_size: this.path + '.files.size',
		files_filetype: this.path + '.files.filetype',
		// virtuals
		files_order: this.path + '.files_order',
	};

	var fileSchemaPaths = new mongoose.Schema({
		id: String,
		name: String,
		description: String,
		filename: String,
		originalname: String,
		path: String,
		size: Number,
		filetype: String,
		},{
			toJSON: {
				virtuals: true
			}
		});

	// The .href virtual returns the public path of the file
	fileSchemaPaths.virtual('href').get(function () {
		return field.href(this);
	});

	var schemaPaths = new mongoose.Schema({
		defaultSelected: { type: String } ,
		defaultSelectedIndex: { type: Number } ,
		files: [fileSchemaPaths]
	});


	schema.add(this._path.addTo({}, schemaPaths));

	var exists = function (item, element_id) {
		var values = item.get(field.paths.files);
		var value;

		if (typeof values === 'undefined' || values.length === 0) {
			return false;
		}

		// if current Field contains any file, it means it exists
		if (typeof element_id === 'undefined') {
			value = values[0];
		} else {
			// allow implicit type coercion to compare string IDs with MongoID objects
			value = values.find(function (val) { return val._id == element_id; }); // eslint-disable-line eqeqeq
		}

		if (typeof value === 'undefined') {
			return false;
		}

		var filepaths = value.path;
		var filename = value.filename;

		if (!filepaths || !filename) {
			return false;
		}

		return fs.existsSync(path.join(filepaths, filename));
	};



	var reset = function (item, element_id) {
		if (typeof element_id === 'undefined') {
			item.set(field.paths.files, []);
		} else {
			var values = item.get(field.paths.files);
			// allow implicit type coercion to compare string IDs with MongoID objects
			var value = values.find(function (val) { return val._id == element_id; }); // eslint-disable-line eqeqeq
			if (typeof value !== 'undefined') {
				values.splice(values.indexOf(value), 1);
				item.set(field.paths.files, values);
			}
		}
	};

	var schemaMethods = {
		exists: function () {
			return exists(this);
		},
		/**
		 * Resets the value of the field
		 */
		reset: function () {
			reset(this);
		},
		/**
		 * Deletes the file from describedlocalfiles and resets the field
		 */
		delete: function (element_id) {
			if (exists(this, element_id)) {
				var values = this.get(field.paths.files);
				// allow implicit type coercion to compare string IDs with MongoID objects
				var value = values.find(function (val) { return val._id == element_id; }); // eslint-disable-line eqeqeq
				if (typeof value !== 'undefined') {
					fs.unlinkSync(path.join(value.path, value.filename));
				}
			}
			reset(this, element_id);
		},
	};

	_.forEach(schemaMethods, function (fn, key) {
		field.underscoreMethod(key, fn);
	});

	// expose a method on the field to call schema methods
	this.apply = function (item, method) {
		return schemaMethods[method].apply(item, Array.prototype.slice.call(arguments, 2));
	};
	this.bindUnderscoreMethods();
};

/**
 * Formats the field value
 */
describedlocalfiles.prototype.format = function (item, i) {
	var files = item.get(this.path);
	if (typeof i === 'undefined') {
		return utils.plural(files.length, '* File');
	}
	var file = files[i];
	if (!file) return '';
	if (this.hasFormatter()) {
		file.href = this.href(file);
		return this.options.format.call(this, item, file);
	}
	return file.filename;
};

/**
 * Detects whether the field has a formatter function
 */
describedlocalfiles.prototype.hasFormatter = function () {
	return typeof this.options.format === 'function';
};

/**
 * Return the public href for a single stored file
 */
describedlocalfiles.prototype.href = function (file) {
	if (!file.filename) return '';
	var prefix = this.options.prefix ? this.options.prefix : file.path;
	return prefix + '/' + file.filename;
};

/**
 * Detects whether the field has been modified
 */
describedlocalfiles.prototype.isModified = function (item) {
	return item.isModified(this.paths.path);
};

/**
 * Validates that a value for this field has been provided in a data object
 *
 * Deprecated
 */
describedlocalfiles.prototype.inputIsValid = function (data) { // eslint-disable-line no-unused-vars
	// TODO - how should file field input be validated?
	return true;
};

/**
 * Updates the value for this field in the item from a data object
 */
describedlocalfiles.prototype.updateItem = function (item, data, callback) { // eslint-disable-line no-unused-vars
	// TODO - direct updating of data (not via upload)
	process.nextTick(callback);
};


describedlocalfiles.prototype.remove = function (item) {
	debugger;
};

/**
 * Uploads the file for this field
 */
describedlocalfiles.prototype.uploadFiles = function (item, files, update,callback) {

	var field = this;


	async.map(files, function (uploadedFile, processedFile) {
		var file  = uploadedFile.file;
		var id = uploadedFile._id;

		var prefix = field.options.datePrefix ? moment().format(field.options.datePrefix) + '-' : '';
		var filename = prefix + file.name;
		var filetype = file.mimetype || file.type;

		if (field.options.allowedTypes && !_.includes(field.options.allowedTypes, filetype)) {
			return processedFile(new Error('Unsupported File Type: ' + filetype));
		}

		var doMove = function (doneMove) {

			if (typeof field.options.filename === 'function') {
				filename = field.options.filename(item, file);
			}

			fs.move(file.path, path.join(field.options.dest, filename), { clobber: field.options.overwrite }, function (err) {
				if (err) return doneMove(err);
				var fileData = {
					filename: filename,
					originalname: file.originalname,
					path: field.options.dest,
					size: file.size,
					filetype: filetype,
				};
				if (update) {
					var fileItem = item.get(field.paths.files).id(id);
					fileItem.set('filename', filename);
					fileItem.set('originalname', file.originalname);
					fileItem.set('path', field.options.dest);
					fileItem.set('size', file.size);
					fileItem.set('filetype', filetype);
				}
				doneMove(null, fileData);
			});

		};

		field.callHook('pre:move', item, file, function (err) {
			if (err) return processedFile(err);
			doMove(function (err, fileData) {
				if (err) return processedFile(err);
				field.callHook('post:move', item, file, fileData, function (err) {
					return processedFile(err, fileData);
				});
			});
		});

	}, callback);

};

describedlocalfiles.prototype.updateItem = function (item, data, files, callback) {
	var field = this;
	var	paths = field.paths;

	// get file orderOrder
	var order = this.getValueFromData(data, '.files_order');

	order = (order && order.length > 0) ? order.split(';') : [];

	// look at exsiting files and see if any need removing.
	var currentFiles = item.get(paths.files);
	if (currentFiles && currentFiles.length) {
		var remove = [];
		currentFiles.forEach(function (file) {
			var id = file._id.toString();
			if (!~order.indexOf(id))
				remove.push(file);
		});
		remove.forEach(function (file) {
			field.apply(item, 'delete', file._id);
		});
	}


	// set the order and the name property
	var efiles = [];
	order.forEach(function (id) {
		var name = field.getValueFromData(data,'.files.name.' + id);
		var description = field.getValueFromData(data,'.files.description.' + id);
		var file = currentFiles.id(keystone.mongoose.Types.ObjectId(id));
		if (file) {
			file.name = name;
			file.description = description;
			efiles.push(file);
		}
	});


	var uploadfiles = [];
	// Upload new files and attach
	normalizeToArray(this.getValueFromData(files, '.newfiles')).forEach(function (file) {
		uploadfiles.push(file);
	});

	var allfiles = efiles.concat(uploadfiles);

	item.set(paths.files, allfiles);

	allfiles = item.get(paths.files);

	uploadfiles = uploadfiles.map(function (file, index) {
		return {
			_id: allfiles[efiles.length + index]._id,
			file: file
		}
	})

	// set the defaultselected file.
	var defaultSelected = this.getValueFromData(data, '.defaultSelected');
	if (order.indexOf(defaultSelected) == -1)
		defaultSelected = (allfiles[0] && allfiles[0]._id) || "";
	item.set(paths.defaultSelected, defaultSelected );



	// set the defaultselectedIndex of file.
	var defaultSelectedIndex = order.indexOf(defaultSelected);

	if (defaultSelectedIndex == -1 && allfiles.length)
		defaultSelectedIndex = 0;

	if (defaultSelectedIndex == -1)
		defaultSelectedIndex = null;

	item.set(paths.defaultSelectedIndex, defaultSelectedIndex );


	if (uploadfiles.length) {
			return field.uploadFiles(item, uploadfiles, true, callback);
		}

		return callback();
}


function normalizeToArray(val) {
	if (Array.isArray(val))
		return val;
	if (!val)
		return [];
	return [val];
}

function getFileFromId(files, id) {
	for (var i = 0 ; i < files.length ; i++ ) {
		if (files[i]._id === id)
			return files[i];
	}
	return null;
}



/* Export Field Type */
module.exports = describedlocalfiles;
