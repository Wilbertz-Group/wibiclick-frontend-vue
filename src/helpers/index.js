import moment from 'moment'
import axios from "axios";
import { Tooltip, Modal, Tabs } from 'flowbite'
import { useToast } from 'vue-toast-notification';

const toast = useToast();

const generateBorder = (doc) => {
	doc.lineWidth(5);
	doc.lineJoin('square')
		.rect(10, 10, 576, 823)
		.stroke('#000000');
}

const generateTableRow = (
	doc,
	y,
	item,
	description,
	unitCost,
	quantity,
	lineTotal
) => {
	doc
		.fontSize(9)
		.text(item, 50, y)
		.fontSize(7)
		.text(description, 50, y + 10)
		.fontSize(9)
		.text(unitCost, 350, y, { width: 90, align: "right" })
		.text(quantity, 400, y, { width: 90, align: "right" })
		.text(lineTotal, 0, y, { align: "right" });
}

const getBase64FromUrl = async (url) => {
	const data = await fetch(url);
	const blob = await data.blob();
	return new Promise((resolve) => {
		const reader = new FileReader();
		reader.readAsDataURL(blob); 
		reader.onloadend = () => {
			const base64data = reader.result;   
			resolve(base64data);
		}
	});
}

const universalDateFormatter = (dat) => {
	let dt = dat
	return moment().isSame(dt, 'day') ? moment(dt).format('h:mm a') : moment(dt).format("ddd, DD MMM YYYY");
}

const dateFormatter = (dat) => {
	let dt = dat
	return dat ? moment().isSame(dt, 'day') ? moment(dt).format('h:mm a') : moment(dt).format('ddd, DD MMM YYYY - h:mm a') : '-';
}

const universalTimeFormatter = (dat) => {
	let dt = dat
	return moment().isSame(dt, 'day') ? moment(dt).format('h:mm a') : moment(dt).format("h:mm a");
}

const dateTimestamp = (dat) => {
	return moment(dat).format("x")
}

const tooltips = () => {
	const options = {
    placement: 'top',
    triggerType: 'hover',
  };

	// tooltip-note
	const $targetEl = document.getElementById('tooltip-note');
	const $triggerEl = document.getElementById('tooltip-note-button');

	if ($targetEl) {
		new Tooltip($targetEl, $triggerEl, options);
	}

	// tooltip-email
	const $targetE2 = document.getElementById('tooltip-email');
	const $triggerE2 = document.getElementById('tooltip-email-button');

	if ($targetE2) {
		new Tooltip($targetE2, $triggerE2, options);
	}

	// tooltip-whatsapp
	const $targetE3 = document.getElementById('tooltip-whatsapp');
	const $triggerE3 = document.getElementById('tooltip-whatsapp-button');

	if ($targetE3) {
		new Tooltip($targetE3, $triggerE3, options);
	}

	// tooltip-call
	const $targetE4 = document.getElementById('tooltip-call');
	const $triggerE4 = document.getElementById('tooltip-call-button');

	if ($targetE4) {
		new Tooltip($targetE4, $triggerE4, options);
	}

	// tooltip-activity
	const $targetE5 = document.getElementById('tooltip-activity');
	const $triggerE5 = document.getElementById('tooltip-activity-button');

	if ($targetE5) {
		new Tooltip($targetE5, $triggerE5, options);
	}

	// tooltip-view-contacts
	const $targetE6 = document.getElementById('tooltip-view-contacts');
	const $triggerE6 = document.getElementById('tooltip-view-contacts-button');

	if ($targetE6) {
		new Tooltip($targetE6, $triggerE6, options);
	}

	// tooltip-add-job
	const $targetE7 = document.getElementById('tooltip-add-job');
	const $triggerE7 = document.getElementById('tooltip-add-job-button');

	if ($targetE7) {
		new Tooltip($targetE7, $triggerE7, options);
	}

	// tooltip-add-estimate
	const $targetE8 = document.getElementById('tooltip-add-estimate');
	const $triggerE8 = document.getElementById('tooltip-add-estimate-button');

	if ($targetE8) {
		new Tooltip($targetE8, $triggerE8, options);
	}

	// tooltip-add-invoice
	const $targetE9 = document.getElementById('tooltip-add-invoice');
	const $triggerE9 = document.getElementById('tooltip-add-invoice-button');

	if ($targetE9) {
		new Tooltip($targetE9, $triggerE9, options);
	}

	// tooltip-view-in-hubspot
	const $targetE10 = document.getElementById('tooltip-add-hubspot');
	const $triggerE10 = document.getElementById('tooltip-add-hubspot-button');

	if ($targetE10) {
		new Tooltip($targetE10, $triggerE10, options);
	}
}

const noteModal = (modelValue, wid, id, reloadTimeline) => {
	const $buttonElement = document.querySelector('#tooltip-note-button');
	const $modalElement = document.querySelector('#noteModal');
	const $closeButton = document.querySelector('#noteModalClose');
	const $closesButton = document.querySelector('#noteModalCloses');
	const $saveNoteButton = document.querySelector('#noteModalSave');

	const modalOptions = {
		placement: 'bottom-right',
		backdropClasses: 'bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40',
		onShow: () => {
			// Remove inert attribute when showing the modal
			$modalElement.removeAttribute('inert');
		},
		onHide: () => {
			// Add inert attribute when hiding the modal
			$modalElement.setAttribute('inert', '');
			// Move focus to a safe element outside the modal
			document.body.focus();
		}
	};

	const modal = new Modal($modalElement, modalOptions);

	// $buttonElement.addEventListener('click', () => modal.toggle()); // Removed: Handled by Vue @click
	$closeButton.addEventListener('click', () => {
		// Ensure focus is moved before hiding the modal
		document.body.focus();
		modal.hide();
	});
	$closesButton.addEventListener('click', () => {
		// Ensure focus is moved before hiding the modal
		document.body.focus();
		modal.hide();
	});
	$saveNoteButton.addEventListener('click', async() => {
		//Save Note logic
		let notes = modelValue.value

		await axios.post(`add-notes?id=${wid}`, { id, notes });
		reloadTimeline()
		toast.success(`Notes have been successfully saved`)
		modal.hide();		
	});
	
	// Return the modal instance so we can call show() from the Vue component
	return modal;
}

const whatsappModal = (modelValue, id, phone) => {
	const $buttonElement = document.querySelector('#tooltip-whatsapp-button');
	const $modalElement = document.querySelector('#whatsappModal');
	const $closeButton = document.querySelector('#whatsappModalClose');
	const $closesButton = document.querySelector('#whatsappModalCloses');
	const $saveWhatsappButton = document.querySelector('#whatsappModalSave');

	const modalOptions = {
		placement: 'bottom-right',
		backdropClasses: 'bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40',
		onShow: () => {
			// Remove inert attribute when showing the modal
			$modalElement.removeAttribute('inert');
		},
		onHide: () => {
			// Add inert attribute when hiding the modal
			$modalElement.setAttribute('inert', '');
			// Move focus to a safe element outside the modal
			document.body.focus();
		}
	};

	const modal = new Modal($modalElement, modalOptions);

	// $buttonElement.addEventListener('click', async() => modal.toggle()); // Removed: Handled by Vue @click
	$closeButton.addEventListener('click', () => {
		// Ensure focus is moved before hiding the modal
		document.body.focus();
		modal.hide();
	});
	$closesButton.addEventListener('click', () => {
		// Ensure focus is moved before hiding the modal
		document.body.focus();
		modal.hide();
	});
	$saveWhatsappButton.addEventListener('click', async() => {
		//Save Whatsapp logic
		//console.log(modelValue.value)
		let to = phone + '@s.whatsapp.net'
		let message = modelValue.value

		try {
			const res = await axios.post(`onwhatsapp?id=${id}`, { to });
			
			await axios.post(`send-whatsapp?id=${id}`, { to, message });
			toast.success(`Message have been successfully sent to client on whatsapp`)
			modal.hide()
		} catch (error) {
			toast.error(`This client number ${phone} is not on whatsapp`)
			modal.hide()
		}
		
	});
	
	// Return the modal instance so we can call show() from the Vue component
	return modal;
}

export { 
	generateBorder, 
	generateTableRow, 
	getBase64FromUrl, 
	universalDateFormatter, 
	universalTimeFormatter,
	dateFormatter, 
	tooltips,
	noteModal,
	whatsappModal,
	dateTimestamp
}