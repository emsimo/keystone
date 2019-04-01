import { ModalHeader, ModalFooter, ModalBody, Modal, Button } from 'elemental';
import Field from '../Field';
import React from 'react';
import { InputGroup } from 'elemental';

module.exports = Field.create({
	displayName: 'FrameField',


	getInitialState () {
		return {
			modalIsOpen : false,
			frameUrl : ''
		};
	},

	getDefaultProps () {
		return {
			urlPrefix : ''
		};
	},

	updateValue (value) {
		this.props.onChange({
			path: this.props.path,
			value: value
		});
	},


	handleClick() {
		var urlPrefix = this.props.urlPrefix ? this.props.urlPrefix : '';
		var url = urlPrefix + document.location.href.substr(document.location.href.lastIndexOf('/'));
		var height = window.innerHeight - 230;
		var width = window.innerWidth - 40;
		this.setState({ modalIsOpen : true, frameUrl : url, width:width, height:height });
		var that = this;
		window.embeddedFrame = {
			resize : function(height) {
			//	that.setState({ height: height });
			},

			close : function() {
				that.setState({ modalIsOpen : false });
			}
		}
	},

	renderField () {
		var style = { border :0 };
		return (
			<div className="field-type-color__wrapper">
				<Modal isOpen={this.state.modalIsOpen}  width={this.state.width} backdropClosesModal>
					<ModalBody>
						<iframe style={style} width="100%" height={this.state.height} src={this.state.frameUrl}></iframe>
					</ModalBody>
				</Modal>
				<InputGroup>
					<InputGroup.Section>
						<button type="button" onClick={this.handleClick} className="FormInput FormSelect">
							Edit
						</button>
					</InputGroup.Section>
				</InputGroup>
			</div>
		);
	}

});
