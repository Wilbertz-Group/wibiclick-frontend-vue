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
	return moment().isSame(dt, 'day') ? moment(dt).format('h:mm a') : moment(dt).format("dddd, DD MMMM YYYY");
}

const dateFormatter = (dat) => {
	let dt = dat
	return dat ? moment().isSame(dt, 'day') ? moment(dt).format('h:mm a') : moment(dt).format('MMM DD, YYYY - h:mm a') : '-';
}

const universalTimeFormatter = (dat) => {
	let dt = dat.slice(0, 16)
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
}

const noteModal = (modelValue, wid, id) => {
	const $buttonElement = document.querySelector('#tooltip-note-button');
	const $modalElement = document.querySelector('#noteModal');
	const $closeButton = document.querySelector('#noteModalClose');
	const $saveNoteButton = document.querySelector('#noteModalSave');

	const modalOptions = {
		placement: 'bottom-right',
		backdropClasses: 'bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40',
	};

	const modal = new Modal($modalElement, modalOptions);

	$buttonElement.addEventListener('click', () => modal.toggle());
	$closeButton.addEventListener('click', () => modal.hide());
	$saveNoteButton.addEventListener('click', async() => {
		//Save Note logic
		let notes = modelValue.value

		await axios.post(`add-notes?id=${wid}`, { id, notes });
		toast.success(`Notes have been successfully saved`)
		modal.hide()
	});
}

const whatsappModal = (modelValue, id, phone) => {
	const $buttonElement = document.querySelector('#tooltip-whatsapp-button');
	const $modalElement = document.querySelector('#whatsappModal');
	const $closeButton = document.querySelector('#whatsappModalClose');
	const $saveWhatsappButton = document.querySelector('#whatsappModalSave');

	const modalOptions = {
		placement: 'bottom-right',
		backdropClasses: 'bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40',
	};

	const modal = new Modal($modalElement, modalOptions);

	$buttonElement.addEventListener('click', async() => modal.toggle());
	$closeButton.addEventListener('click', () => modal.hide());
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
}

const timelineTabs = (modelValue, id, phone) => {
	const tabElements = [
		{
				id: 'activity',
				triggerEl: document.querySelector('#activity-tab-el'),
				targetEl: document.querySelector('#activity-el')
		},
		{
				id: 'whatsapp',
				triggerEl: document.querySelector('#whatsapp-tab-el'),
				targetEl: document.querySelector('#whatsapp-el')
		},
		{
				id: 'notes',
				triggerEl: document.querySelector('#notes-tab-el'),
				targetEl: document.querySelector('#notes-el')
		},
	];

	// options with default values
	const options = {
			defaultTabId: 'activity',
			activeClasses: 'text-blue-600 border-b-2 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-400 border-blue-700 dark:border-blue-500',
			inactiveClasses: 'text-gray-500 hover:text-gray-600 dark:text-gray-400 border-gray-100 hover:border-gray-300 dark:border-gray-700 dark:hover:text-gray-300',
	};

	const tabs = new Tabs(tabElements, options);
}

export { 
	generateBorder, 
	generateTableRow, 
	getBase64FromUrl, 
	universalDateFormatter, 
	dateFormatter, 
	tooltips,
	noteModal,
	whatsappModal,
	dateTimestamp,
	timelineTabs
}