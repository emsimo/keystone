import Field from '../Field';
import React from 'react';

import { Card, InputGroup, Form, FormSelect, FormField, FormInput, Button, FileUpload, Radio, Glyph } from 'elemental';
import ThumbnailFileInput from '../../components/ThumbnailFileInput';

var SortableContainer = require('react-anything-sortable');
var SortableItemMixin = require('react-anything-sortable').SortableItemMixin;

var SortableItem = React.createClass({
	mixins: [SortableItemMixin],

	render: function(){
		return this.renderWithSortable (
			<div>
				{this.props.children}
			</div>
		);
	}
});


module.exports = Field.create({
	displayName: 'DescribedLocalFilesField',
	statics: {
		type: 'DescribedLocalFiles',
	},

	componentWillReceiveProps: function(nextProps) {
		if (!nextProps.value.newfiles || !nextProps.value.newfiles.length) {
			// clear out the newFiles input if there are no files.
			this.refs.thumbnails.clear();
		}
	},


	onFileChange: function (files) {
		const { value = { files :[], newfiles:[] } } = this.props;
		value.newfiles = value.newfiles.concat(files);
		this.valueChanged(value);
	},

	onOpenClick: function () {
		this.refs.thumbnails.open();
	},

	onFileSort : function(order) {
		const { value = { files :[], newfiles:[] } } = this.props;
		value.files.sort(function(a,b){
			if (order.indexOf(a._id) < order.indexOf(b._id))
				return -1;
			if (order.indexOf(a._id) > order.indexOf(b._id))
				return 1;
			if (order.indexOf(a._id) == order.indexOf(b._id))
				return 0;
		})
		this.valueChanged(value);
	},

	removeFile: function (i) {
		const { value = { files :[], newfiles:[] } } = this.props;
		value.files.splice(i,1);
		this.valueChanged(value);
	},

	updateFile: function (i, attr, event, newValue) {
		const { value = { files :[], newfiles:[] } } = this.props;
		var updatedValues = value;
		var updateIndex = updatedValues.files.indexOf(i);
		newValue = newValue || event.value || event.target.value;
		updatedValues.files[updateIndex][attr] = newValue;
		this.valueChanged(updatedValues);
	},

	updateDefault : function(val) {
		const { value = { files :[], newfiles:[] } } = this.props;
		value.defaultSelected = val;
		this.valueChanged(value);
	},

	valueChanged: function (value) {
		this.props.onChange({
			path: this.props.path,
			value: value,
		});
	},

	renderDefaultSelected : function(value) {
		return <input type='hidden' name={this.props.paths.defaultSelected} value={value.defaultSelected}  />
	},

	renderOrder : function(value) {
		const fileorder = value.files.map(function(file) {
			return file._id;
		}).join(';');
		return <input type="hidden" name={this.props.paths.files_order}  value={fileorder}/>;
	},

	renderField: function () {
		const { value = { files :[] } } = this.props;
		if (!Array.isArray(value.newfiles)) value.newfiles =[];
		return (
			<div>
				{this.renderDefaultSelected(value)}
				{this.renderOrder(value)}
				<SortableContainer className="vertical-container" direction="vertical" sortHandle="handle" containment dynamic onSort={this.onFileSort} >
					{value.files.map(this.renderFile(this, value))}
				</SortableContainer>
				<Card>
					<ThumbnailFileInput name={this.props.paths.newfiles} onFileChange={this.onFileChange} ref="thumbnails">
						<div>Click to select files to upload.</div>
							{value.newfiles.length > 0 ? <div>
							<div>{value.newfiles.map((file) => <div className="thumbnail-container"><img className="thumbnail" src={file.preview} /></div> )}</div>
						</div> : null}
					</ThumbnailFileInput>
				</Card>
			</div>
		);
	},

	renderFile: function(field, value) {
		return function (item, index) {
			return (
				<SortableItem className="vertical" sortData={item._id} key={item._id}>
					<Card>
						<InputGroup>
							<InputGroup.Section>
								<Glyph className="handle" icon="three-bars"/>
							</InputGroup.Section>
							<InputGroup.Section grow>
								<FormField>
									<FormInput placeholder="Enter Name"
											   name={field.props.paths.files_name+'.'+item._id}
											   value={item.name}
											   onChange={field.updateFile.bind(field, item, 'name')}
											   autoComplete="off"/>
								</FormField>
								<FormField>
									<FormInput multiline
											   placeholder="Enter description"
											   name={field.props.paths.files_description+'.'+item._id}
											   value={item.description}
											   onChange={field.updateFile.bind(field, item, 'description')}
											   autoComplete="off"/>
								</FormField>
							</InputGroup.Section>
							<InputGroup.Section>
								<img className="thumbnail" src={item.href} />
							</InputGroup.Section>
							<InputGroup.Section>
								<Radio onChange={field.updateDefault.bind(field, item._id)} checked={item._id === value.defaultSelected} />
							</InputGroup.Section>
							<InputGroup.Section>
								<Button type="link-cancel" onClick={field.removeFile.bind(field, index, item)}>
									<span className="octicon octicon-x"/>
								</Button>
							</InputGroup.Section>
						</InputGroup>
					</Card>
				</SortableItem>
			);
		}
	},

	// Override shouldCollapse to check for array length
	shouldCollapse: function () {
		return this.props.collapse && !this.props.value.length;
	}
});
