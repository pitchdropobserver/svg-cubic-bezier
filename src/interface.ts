export interface IPt {
	x: number
	y: number
}

export interface IStyle {
	[index: string]: string
}

export interface IProps {
	parentDom: HTMLElement
	ctrlPts: Array<IPt>
	endMarkerId: string
	startMarkerId: string
	styleCurve: IStyle
	shouldDrawHelpers: boolean
	isDualDirection: boolean
	onCtrlPtClick: Function
}

export interface HTMLInputEvent extends Event {
	target: HTMLInputElement & EventTarget;
}
