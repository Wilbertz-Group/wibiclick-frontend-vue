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

export { generateBorder, generateTableRow, getBase64FromUrl }