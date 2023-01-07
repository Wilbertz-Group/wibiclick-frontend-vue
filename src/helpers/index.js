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

export { generateBorder, generateTableRow }