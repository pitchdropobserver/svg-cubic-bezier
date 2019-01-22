export interface IPt {
	x: number
	y: number
}

export interface ICssStyle {
	[index: string]: string
}

export interface IAnimParam {
	dur: number
	delay: number
	ease: 'string'
}

export interface IProps {
	parentDom: HTMLElement
	ctrlPts: Array<IPt>
	endMarkerId: string
	startMarkerId: string
	styleCurve: ICssStyle
	styleAnchorPts: ICssStyle
	styleCtrlPts: ICssStyle
	styleHandles: ICssStyle
	shouldShowCtrlPts: boolean
	isDualDirection: boolean
	onCtrlPtMouseDown: Function
}

export interface HTMLInputEvent extends Event {
	target: HTMLInputElement & EventTarget;
}
