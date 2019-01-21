import SvgElem from 'svg-elem'
import { purgeOwnKeys } from 'brodash'

import {
	STYLE_BZ_CURVE,
	STYLE_CTRL_PT,
	STYLE_START_PT_END_PT,
	STYLE_CTRL_LINE,
} from './constants'

import { IProps } from './interface'

class SvgCubicBezier {

	private props: IProps
	//---- element references ----
	private svgBezierCurve: SvgElem
	private svgStartPt: SvgElem
	private svgEndPt: SvgElem
	private svgCtrlPtStart: SvgElem
	private svgCtrlPtEnd: SvgElem
	private svgCtrlLineStart: SvgElem
	private svgCtrlLineEnd: SvgElem

	constructor(props: IProps) {
		this.props = Object.assign({
			// default props...
			parentDom: null,
			startPt: null,
			endPt: null,
			ctrlPtStart: null,
			ctrlPtEnd: null,
			endMarkerId: '',
			startMarkerId: '',
			styleCurve: null,
			shouldDrawHelpers: false,
			isDualDirection: false, // if curve is dual direction, control pts will flips sides when crv startPt moves to right of endPt...
		}, props)
		return this
	}

	public updateProps(props: IProps): SvgCubicBezier {
		Object.assign(this.props, props)
		this.calc()
		this.draw()
		return this
	}

	public remove(): void {
		if (this.svgBezierCurve !== null) this.svgBezierCurve.destroy()
		if (this.svgStartPt !== null) this.svgStartPt.destroy()
		if (this.svgEndPt !== null) this.svgEndPt.destroy()
		if (this.svgCtrlPtStart !== null) this.svgCtrlPtStart.destroy()
		if (this.svgCtrlPtEnd !== null) this.svgCtrlPtEnd.destroy()
		if (this.svgCtrlLineStart !== null) this.svgCtrlLineStart.destroy()
		if (this.svgCtrlLineEnd !== null) this.svgCtrlLineEnd.destroy()
		purgeOwnKeys(this, true)
	}

	private calc(): SvgCubicBezier {
		this.calcControlPts()
		return this
	}

	private draw(): SvgCubicBezier {
		const { shouldDrawHelpers } = this.props
		this.drawBezierCurve()
		if (shouldDrawHelpers) {
			this.drawStartEndPt()
			this.drawHelpers()
		}
		return this
	}

	private calcControlPts(): void {
		const { startPt, endPt, isDualDirection } = this.props
		// location of control pts is determined by the shape of bounding rectangle created by the prescribed start and end pt...
		let dx = endPt.x - startPt.x
		let dy = endPt.y - startPt.y
		// calibrate control pt extension based on rectW, rectH ratio
		const rectW = Math.abs(dx)
		const rectH = Math.abs(dy)
		if (rectW > rectH) { // wider than tall...
			const w_h_delta = rectW - rectH // 0.001 -> infinity
			const ratio = w_h_delta / rectH // 0.001 -> inifinty, passes 1 when w > h * 2
			const transitionRatio = 1 - Math.min(ratio, 0.5) // locked to 1.0 -> 0.5, as w increases
			dx = Math.sign(dx) * rectW * transitionRatio
		} else { // taller than wide...
			dx = Math.sign(dx) * rectH
			if (dx === 0) dx = rectH // when Math.sign returns 0...
		}

		if (!isDualDirection) {
			dx = Math.abs(dx)
			dy = Math.abs(dy)
		}
		Object.assign(
			this.props, {
				ctrlPtStart: {
					x: startPt.x + dx,
					y: startPt.y
				},
				ctrlPtEnd: {
					x: endPt.x - dx,
					y: endPt.y
				},
			}
		)
	}

	private drawBezierCurve(): void {
		const {
			parentDom,
			startPt, endPt,
			ctrlPtStart, ctrlPtEnd,
			startMarkerId, endMarkerId,
			styleCurve,
		} = this.props
		const {
			svgBezierCurve,
		} = this
		let svgPath = ''

		svgPath += [
			'M',
			startPt.x,
			startPt.y
		].join(' ')

		// https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths#Bezier_Curves
		svgPath += [
			'C',
			ctrlPtStart.x,
			ctrlPtStart.y,
			ctrlPtEnd.x,
			ctrlPtEnd.y,
			endPt.x,
			endPt.y
		].join(' ')

		const attr = {
			'marker-start': startMarkerId ? `url(#${startMarkerId})` : 'none',
			'marker-end': endMarkerId ? `url(#${endMarkerId})` : 'none',
			'd': svgPath,
		}

		if (svgBezierCurve instanceof SvgElem) { // update...
			svgBezierCurve.setAttr(attr)
		} else { // init...
			this.svgBezierCurve = new SvgElem({
				parentDom: parentDom,
				tag: 'path',
				style: styleCurve || STYLE_BZ_CURVE,
				attr,
			})
		}
	}

	private drawStartEndPt(): void {
		const { parentDom, startPt, endPt } = this.props
		const { svgStartPt, svgEndPt } = this

		if (svgStartPt instanceof SvgElem) { // update...
			svgStartPt.setAttr({
				'cx': startPt.x,
				'cy': startPt.y,
				'r': 4,
			})
			svgEndPt.setAttr({
				'cx': endPt.x,
				'cy': endPt.y,
				'r': 4,
			})
		} else { // init...
			this.svgStartPt = new SvgElem({
				parentDom: parentDom,
				tag: 'circle',
				style: STYLE_START_PT_END_PT,
				attr: {
					'id': 'wire-start',
					'cx': startPt.x,
					'cy': startPt.y,
					'r': 4,
				}
			})
			this.svgEndPt = new SvgElem({
				parentDom: parentDom,
				tag: 'circle',
				style: STYLE_START_PT_END_PT,
				attr: {
					'id': 'wire-end',
					'cx': endPt.x,
					'cy': endPt.y,
					'r': 4,
				}
			})
		}
	}

	private drawHelpers(): void {
		const {
			parentDom,
			startPt, endPt,
			ctrlPtStart, ctrlPtEnd,
		} = this.props

		const {
			svgCtrlPtStart,
			svgCtrlLineStart,
			svgCtrlPtEnd,
			svgCtrlLineEnd,
		} = this

		if (svgCtrlPtStart instanceof SvgElem) { // update...
			svgCtrlPtStart.setAttr({
				'cx': ctrlPtStart.x,
				'cy': ctrlPtStart.y,
				'r': 4,
			})
			svgCtrlLineStart.setAttr({
				'x1': startPt.x,
				'y1': startPt.y,
				'x2': ctrlPtStart.x,
				'y2': ctrlPtStart.y,
			})
			svgCtrlPtEnd.setAttr({
				'cx': ctrlPtEnd.x,
				'cy': ctrlPtEnd.y,
				'r': 4,
			})
			svgCtrlLineEnd.setAttr({
				'x1': endPt.x,
				'y1': endPt.y,
				'x2': ctrlPtEnd.x,
				'y2': ctrlPtEnd.y,
			})
		} else { // init...
			this.svgCtrlPtStart = new SvgElem({
				parentDom: parentDom,
				tag: 'circle',
				style: STYLE_CTRL_PT,
				attr: {
					'cx': ctrlPtStart.x,
					'cy': ctrlPtStart.y,
					'r': 4,
				}
			})
			this.svgCtrlLineStart = new SvgElem({
				parentDom: parentDom,
				tag: 'line',
				style: STYLE_CTRL_LINE,
				attr: {
					'x1': startPt.x,
					'y1': startPt.y,
					'x2': ctrlPtStart.x,
					'y2': ctrlPtStart.y,
				}
			})
			this.svgCtrlPtEnd = new SvgElem({
				parentDom: parentDom,
				tag: 'circle',
				style: STYLE_CTRL_PT,
				attr: {
					'cx': ctrlPtEnd.x,
					'cy': ctrlPtEnd.y,
					'r': 4,
				}
			})
			this.svgCtrlLineEnd = new SvgElem({
				parentDom: parentDom,
				tag: 'line',
				style: STYLE_CTRL_LINE,
				attr: {
					'x1': endPt.x,
					'y1': endPt.y,
					'x2': ctrlPtEnd.x,
					'y2': ctrlPtEnd.y,
				}
			})
		}

	}


}

Object.defineProperty(SvgCubicBezier.prototype, 'id', {
	get(): string { return this.props.id },
	set(val: string): void { this.props.id = val }
})

export default SvgCubicBezier
