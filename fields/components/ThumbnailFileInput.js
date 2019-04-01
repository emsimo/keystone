/* eslint prefer-template: 0 */

import React from 'react';

const supportMultiple = (typeof document !== 'undefined' && document && document.createElement) ?
'multiple' in document.createElement('input') :
	true;

class ThumbnailFileInput extends React.Component {
	constructor(props, context) {
		super(props, context);
		this.onClick = this.onClick.bind(this);
		this.onFileChange = this.onFileChange.bind(this);

	}


	onFileChange(e) {
		e.preventDefault();


		const inputFiles = e.target.files;
		const max = this.props.multiple ? inputFiles.length : Math.min(inputFiles.length, 1);
		const files = [];

		for (let i = 0; i < max; i++) {
			const file = inputFiles[i];
			// We might want to disable the preview creation to support big files
			if (!this.props.disablePreview) {
				file.preview = window.URL.createObjectURL(file);
			}
			files.push(file);
		}

		if (this.props.onFileChange) {
			this.props.onFileChange.call(this, files, e);
		}


	}

	onClick() {
		this.open();
	}

	open() {
		this.fileInputEl.value = null;
		this.fileInputEl.click();
	}

	clear() {
		this.fileInputEl.value = null;
	}

	render() {
		const {
			accept,
			inputProps,
			multiple,
			onFileChange,
			disablePreview,
			name,
			...rest
			} = this.props;

		let {
			className,
			style,
			...props // eslint-disable-line prefer-const
			} = rest;


		className = className || '';


		if (!className && !style) {
			style = {
				width: '100%',
				minHeight: 200
			};
		}

		let appliedStyle;
			appliedStyle = {
				...style
			};

		const inputAttributes = {
			accept,
			type: 'file',
			style: { display: 'none' },
			multiple: supportMultiple && multiple,
			ref: el => this.fileInputEl = el, // eslint-disable-line
			onChange: this.onFileChange
		};

		if (name && name.length) {
			inputAttributes.name = name;
		}

		// Remove custom properties before passing them to the wrapper div element
		const divProps = { ...props };

		return (
			<div
				className={className}
				style={appliedStyle}
				{...divProps/* expand user provided props first so event handlers are never overridden */}
				onClick={this.onClick}
			>
				{this.props.children}
				<input
					{...inputProps/* expand user provided inputProps first so inputAttributes override them */}
					{...inputAttributes}
				/>
			</div>
		);
	}
}

ThumbnailFileInput.defaultProps = {
	disablePreview: false,
	multiple: true
};

ThumbnailFileInput.propTypes = {
	children: React.PropTypes.node, // Contents of the dropzone
	style: React.PropTypes.object, // CSS styles to apply
	className: React.PropTypes.string, // Optional className

	disablePreview: React.PropTypes.bool, // Enable/disable preview generation

	inputProps: React.PropTypes.object, // Pass additional attributes to the <input type="file"/> tag
	multiple: React.PropTypes.bool, // Allow dropping multiple files
	accept: React.PropTypes.string, // Allow specific types of files. See https://github.com/okonet/attr-accept for more information
	name: React.PropTypes.string // name attribute for the input tag
};

export default ThumbnailFileInput;
