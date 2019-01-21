import SvgElem from 'svg-elem'
import { purgeOwnKeys } from 'brodash'

import {
	STYLE_BZ_CURVE,
	STYLE_CTRL_PT,
	STYLE_START_PT_END_PT,
	STYLE_CTRL_LINE,
} from './constants'

import { IProps, HTMLInputEvent } from './interface'


class SvgCubicBezier {

	public props: IProps
	//---- element references ----
	private svgBezierCurve: SvgElem
	private svgCtrlPt0: SvgElem // start point on  crv
	private svgCtrlPt1: SvgElem // detached control pt off start 
	private svgCtrlPt2: SvgElem // detached control pt off end 
	private svgCtrlPt3: SvgElem // end point on crv
	private svgCtrlArmStart: SvgElem
	private svgCtrlArmEnd: SvgElem

	constructor(props: IProps) {
		this.handlePtClick = this.handlePtClick.bind(this)
		this.props = Object.assign({
			// default props...
			parentDom: null,
			endMarkerId: 'bezier-end-pt',
			startMarkerId: 'bezier-start-pt',
			styleCurve: null,
			shouldDrawHelpers: false,
			isDualDirection: false, // if curve is dual direction, control pts will flips sides when crv startPt moves to right of endPt...
		}, props)
		return this
	}

	public getCtrlPts(){
		return this.props.ctrlPts.slice()
	}

	public handlePtClick(e: HTMLInputEvent): void{
		const { target } = e
		const { 
			onCtrlPtClick,
			endMarkerId,
			startMarkerId,
		} = this.props
		if (onCtrlPtClick !== undefined){
			switch (target.id) {
				case startMarkerId: 
					onCtrlPtClick(0, target, this.svgCtrlPt0)
					break
				case 'bezier-start-ctrl-pt': 
					onCtrlPtClick(1, target, this.svgCtrlPt1)
					break
				case 'bezier-end-ctrl-pt': 
					onCtrlPtClick(2, target, this.svgCtrlPt2)
					break
				case endMarkerId: 
					onCtrlPtClick(3, target, this.svgCtrlPt3)
					break
			}
		}
	}

	public updateProps(props: IProps): SvgCubicBezier {
		Object.assign(this.props, props)
		this.calc()
		this.draw()
		return this
	}

	public remove(): void {
		if (this.svgBezierCurve !== null) this.svgBezierCurve.destroy()
		if (this.svgCtrlPt0 !== null) this.svgCtrlPt0.destroy()
		if (this.svgCtrlPt3 !== null) this.svgCtrlPt3.destroy()
		if (this.svgCtrlPt1 !== null) this.svgCtrlPt1.destroy()
		if (this.svgCtrlPt2 !== null) this.svgCtrlPt2.destroy()
		if (this.svgCtrlArmStart !== null) this.svgCtrlArmStart.destroy()
		if (this.svgCtrlArmEnd !== null) this.svgCtrlArmEnd.destroy()
		purgeOwnKeys(this, true)
	}

	private calc(): SvgCubicBezier {
		const { ctrlPts } = this.props
		if (ctrlPts.length === 2){ // only crv start, end provided...
			this.calcControlPts()
		} else { // all control points provided...
			// no op...
		}
		return this
	}

	private draw(): SvgCubicBezier {
		const { shouldDrawHelpers } = this.props
		this.drawBezierCurve()
		if (shouldDrawHelpers) {
			this.drawCrvStartEndPt()
			this.drawCrvHelperArms()
		}
		return this
	}

	private calcControlPts(): void {
		const { ctrlPts, isDualDirection } = this.props
		// location of control pts is determined by the shape of bounding rectangle created by the prescribed start and end pt...
		const crvStart = ctrlPts[0]
		const crvEnd = ctrlPts[1]
		let dx = crvEnd.x - crvStart.x
		let dy = crvEnd.y - crvStart.y
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
				ctrlPts: [
					crvStart,
					{
						x: crvStart.x + dx,
						y: crvStart.y
					},
					{
						x: crvEnd.x - dx,
						y: crvEnd.y
					},
					crvEnd,
				]				
			}
		)
	}

	private drawBezierCurve(): void {
		const {
			parentDom,
			ctrlPts,
			startMarkerId, endMarkerId,
			styleCurve,
		} = this.props
		const {
			svgBezierCurve,
		} = this
		let svgPath = ''

		svgPath += [
			'M',
			ctrlPts[0].x,
			ctrlPts[0].y
		].join(' ')

		// https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths#Bezier_Curves
		svgPath += [
			'C',
			ctrlPts[1].x,
			ctrlPts[1].y,
			ctrlPts[2].x,
			ctrlPts[2].y,
			ctrlPts[3].x,
			ctrlPts[3].y
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

	private drawCrvStartEndPt(): void {
		const { parentDom, ctrlPts} = this.props
		const { svgCtrlPt0: svgStartPt, svgCtrlPt3: svgEndPt } = this

		if (svgStartPt instanceof SvgElem) { // update...
			svgStartPt.setAttr({ // crv start
				'cx': ctrlPts[0].x,
				'cy': ctrlPts[0].y,
				'r': 4,
			})
			svgEndPt.setAttr({ // crv end
				'cx': ctrlPts[3].x,
				'cy': ctrlPts[3].y,
				'r': 4,
			})
		} else { // init...
		
			this.svgCtrlPt0 = new SvgElem({ // crv start
				parentDom: parentDom,
				tag: 'circle',
				listeners:{
					'mousedown': this.handlePtClick,
				},
				style: STYLE_START_PT_END_PT,
				attr: {
					'id': 'bezier-start-pt',
					'cx': ctrlPts[0].x,
					'cy': ctrlPts[0].y,
					'r': 4,
				}
			})
			this.svgCtrlPt3 = new SvgElem({ // crv end
				parentDom: parentDom,
				tag: 'circle',
				listeners: {
					'mousedown': this.handlePtClick,
				},
				style: STYLE_START_PT_END_PT,
				attr: {
					'id': 'bezier-end-pt',
					'cx': ctrlPts[3].x,
					'cy': ctrlPts[3].y,
					'r': 4,
				}
			})
		}
	}

	private drawCrvHelperArms(): void {
		const {
			parentDom,
			ctrlPts,
		} = this.props

		const {
			svgCtrlArmStart,
			svgCtrlPt1,
			svgCtrlPt2,
			svgCtrlArmEnd,
		} = this

		if (svgCtrlPt1 instanceof SvgElem) { // update...
			svgCtrlPt1.setAttr({
				'cx': ctrlPts[1].x,
				'cy': ctrlPts[1].y,
				'r': 4,
			})
			svgCtrlArmStart.setAttr({
				'x1': ctrlPts[0].x,
				'y1': ctrlPts[0].y,
				'x2': ctrlPts[1].x,
				'y2': ctrlPts[1].y,
			})
			svgCtrlPt2.setAttr({
				'cx': ctrlPts[2].x,
				'cy': ctrlPts[2].y,
				'r': 4,
			})
			svgCtrlArmEnd.setAttr({
				'x1': ctrlPts[3].x,
				'y1': ctrlPts[3].y,
				'x2': ctrlPts[2].x,
				'y2': ctrlPts[2].y,
			})
		} else { // init...
			this.svgCtrlArmStart = new SvgElem({
				parentDom: parentDom,
				tag: 'line',
				style: STYLE_CTRL_LINE,
				attr: {
					'x1': ctrlPts[0].x,
					'y1': ctrlPts[0].y,
					'x2': ctrlPts[1].x,
					'y2': ctrlPts[1].y,
				}
			})
			this.svgCtrlArmEnd = new SvgElem({
				parentDom: parentDom,
				tag: 'line',
				style: STYLE_CTRL_LINE,
				attr: {
					'x1': ctrlPts[3].x,
					'y1': ctrlPts[3].y,
					'x2': ctrlPts[2].x,
					'y2': ctrlPts[2].y,
				}
			})
			this.svgCtrlPt1 = new SvgElem({
				parentDom: parentDom,
				tag: 'circle',
				listeners: {
					'mousedown': this.handlePtClick,
				},
				style: STYLE_CTRL_PT,
				attr: {
					'id': 'bezier-start-ctrl-pt',
					'cx': ctrlPts[1].x,
					'cy': ctrlPts[1].y,
					'r': 4,
				}
			})
			this.svgCtrlPt2 = new SvgElem({
				parentDom: parentDom,
				tag: 'circle',
				listeners: {
					'mousedown': this.handlePtClick,
				},
				style: STYLE_CTRL_PT,
				attr: {
					'id': 'bezier-end-ctrl-pt',
					'cx': ctrlPts[2].x,
					'cy': ctrlPts[2].y,
					'r': 4,
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
