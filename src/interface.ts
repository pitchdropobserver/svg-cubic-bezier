export interface IPt {
	x: number
	y: number
}

export interface IStyle {
	[index: string]: string
}

export interface IProps {
	parentDom: HTMLElement
	startPt: IPt
	endPt: IPt
	ctrlPtStart: IPt,
	ctrlPtEnd: IPt,
	endMarkerId: string
	startMarkerId: string
	styleCurve: IStyle
	shouldDrawHelpers: boolean
	isDualDirection: boolean
}
