import SvgElem from 'svg-elem'
import { purgeOwnKeys, deepMergeTwoObjs, copy } from 'brodash'
import Tween, { ITweenState } from './Tween'
import {
	STYLE_CURVE,
	STYLE_CTRL_PTS,
	STYLE_ANCHOR_PTS,
	STYLE_HANDLES,
} from './constants'

import { 
	IPt,
	IProps,
	IAnimParam,
	HTMLInputEvent,
} from './interface'


class SvgCubicBezier {

	public props: IProps
	//---- bezier curve element ----
	private svgBezierCurve: SvgElem
	//---- helper element ----
	private svgCtrlPt0: SvgElem // start anchor point on  crv
	private svgCtrlPt1: SvgElem // detached control pt off start 
	private svgCtrlPt2: SvgElem // detached control pt off end 
	private svgCtrlPt3: SvgElem // end anchor point on crv
	private svgCtrlHandleStart: SvgElem
	private svgCtrlHandleEnd: SvgElem

	constructor(props: IProps) {
		this.handleCtrlPtMouseDown = this.handleCtrlPtMouseDown.bind(this)
		this.props = deepMergeTwoObjs({
			// default props...
			parentDom: null,
			endMarkerId: 'bezier-ctrl-pt-3',
			startMarkerId: 'bezier-ctrl-pt-0',
			shouldShowCtrlPts: false,
			isDualDirection: false, // if curve is dual direction, control pts will flips sides when start-anchor-pt moves to right of end-anchor-pt...
			styleAnchorPts: copy(STYLE_ANCHOR_PTS),
			styleCtrlPts: copy(STYLE_CTRL_PTS),
			styleHandles: copy(STYLE_HANDLES),
			styleCurve: copy(STYLE_CURVE),
		}, props, 'parentDom')		

		if (this.props.ctrlPts.length === 2) { // if only crv start, end provided...	
			this.calcControlPts()	
		}
		return this
	}

	static reducePts(arrPts: Array<IPt>): ITweenState {
		return arrPts.reduce((prev: Object, pt: IPt, i: number) => {
			prev[`x${i}`] = pt.x
			prev[`y${i}`] = pt.y
			return prev
		}, {})
	}

	public getCtrlPts(){
		return this.props.ctrlPts.slice()
	}

	public handleCtrlPtMouseDown(e: HTMLInputEvent): void{
		const { target } = e
		const { 
			shouldShowCtrlPts,
			onCtrlPtMouseDown,
			endMarkerId,
			startMarkerId,
		} = this.props
		if (shouldShowCtrlPts && onCtrlPtMouseDown){
			switch (target.id) {
				case startMarkerId: 
					onCtrlPtMouseDown(0, target, this.svgCtrlPt0)
					break
				case 'bezier-ctrl-pt-1': 
					onCtrlPtMouseDown(1, target, this.svgCtrlPt1)
					break
				case 'bezier-ctrl-pt-2': 
					onCtrlPtMouseDown(2, target, this.svgCtrlPt2)
					break
				case endMarkerId: 
					onCtrlPtMouseDown(3, target, this.svgCtrlPt3)
					break
			}
		}
	}

	public updateProps(nextProps: IProps, anim: IAnimParam): SvgCubicBezier {
		if(
			nextProps.ctrlPts !== undefined
			&& anim !== undefined	
		){ // if new points provided...
			const { dur, ease, delay } = anim
			const { ctrlPts } = this.props
			const current = SvgCubicBezier.reducePts(this.props.ctrlPts)
			const endState = SvgCubicBezier.reducePts(nextProps.ctrlPts)
			new Tween(current)
				.to(endState, dur)
				.easing(ease)
				.delay(delay)
				.onUpdate(()=>{
					ctrlPts.forEach((pt, i)=>{
						pt.x = current['x' + i]
						pt.y = current['y' + i]
					})
					this.draw()
				})
				.onComplete(()=>{
					deepMergeTwoObjs(this.props, nextProps, 'parentDom')
					this.draw()
				})
				.start()
		} else {
			deepMergeTwoObjs(this.props, nextProps, 'parentDom')
			this.draw()
		}		
		return this
	}

	public remove(): void {
		if (this.svgBezierCurve !== null) this.svgBezierCurve.destroy()
		if (this.svgCtrlPt0 !== null) this.svgCtrlPt0.destroy()
		if (this.svgCtrlPt3 !== null) this.svgCtrlPt3.destroy()
		if (this.svgCtrlPt1 !== null) this.svgCtrlPt1.destroy()
		if (this.svgCtrlPt2 !== null) this.svgCtrlPt2.destroy()
		if (this.svgCtrlHandleStart !== null) this.svgCtrlHandleStart.destroy()
		if (this.svgCtrlHandleEnd !== null) this.svgCtrlHandleEnd.destroy()
		purgeOwnKeys(this, true)
	}

	private draw(): SvgCubicBezier {
		const { shouldShowCtrlPts } = this.props
		this.drawBezierCurve()
		if (shouldShowCtrlPts) {
			this.drawCrvStartEndPt()
			this.drawCrvHelperArms()
		} else {
			const { svgCtrlHandleStart: svgCtrlArmStart } = this
			if (svgCtrlArmStart){ // if helpers are drawn...
				this.removeHelpers()
			}
		}
		return this
	}

	private removeHelpers(): void{
		const { 
			svgCtrlHandleStart,
			svgCtrlHandleEnd,
			svgCtrlPt0,
			svgCtrlPt1,
			svgCtrlPt2,
			svgCtrlPt3,
		} = this
		svgCtrlHandleStart.destroy()
		svgCtrlHandleEnd.destroy()
		svgCtrlPt0.destroy()
		svgCtrlPt1.destroy()
		svgCtrlPt2.destroy()
		svgCtrlPt3.destroy()
		this.svgCtrlHandleStart = undefined
		this.svgCtrlHandleEnd = undefined
		this.svgCtrlPt0 = undefined
		this.svgCtrlPt1 = undefined
		this.svgCtrlPt2 = undefined
		this.svgCtrlPt3 = undefined
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
		const ctrlPt1 = {
			x: crvStart.x + dx,
			y: crvStart.y
		}
		const ctrlPt2 = {
			x: crvEnd.x - dx,
			y: crvEnd.y
		}
	
		Object.assign(
			this.props, {
				ctrlPts: [ crvStart, ctrlPt1, ctrlPt2, crvEnd ]
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
				style: styleCurve,
				attr,
			})
		}
	}

	private drawCrvStartEndPt(): void {
		const { parentDom, ctrlPts, styleAnchorPts } = this.props
		const { svgCtrlPt0, svgCtrlPt3 } = this

		if (svgCtrlPt0 instanceof SvgElem) { // update...
			svgCtrlPt0.setAttr({ // crv start
				'cx': ctrlPts[0].x,
				'cy': ctrlPts[0].y,
				'r': 4,
			})
			svgCtrlPt3.setAttr({ // crv end
				'cx': ctrlPts[3].x,
				'cy': ctrlPts[3].y,
				'r': 4,
			})
		} else { // init...
			this.svgCtrlPt0 = new SvgElem({ // crv start
				parentDom: parentDom,
				tag: 'circle',
				listeners:{
					'mousedown': this.handleCtrlPtMouseDown,
				},
				style: styleAnchorPts,
				attr: {
					'id': 'bezier-ctrl-pt-0',
					'cx': ctrlPts[0].x,
					'cy': ctrlPts[0].y,
					'r': 4,
				}
			})
			this.svgCtrlPt3 = new SvgElem({ // crv end
				parentDom: parentDom,
				tag: 'circle',
				listeners: {
					'mousedown': this.handleCtrlPtMouseDown,
				},
				style: styleAnchorPts,
				attr: {
					'id': 'bezier-ctrl-pt-3',
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
			styleCtrlPts,
			styleHandles,
		} = this.props

		const {
			svgCtrlHandleStart,
			svgCtrlPt1,
			svgCtrlPt2,
			svgCtrlHandleEnd,
		} = this

		if (svgCtrlPt1 instanceof SvgElem) { // update...
			svgCtrlPt1.setAttr({
				'cx': ctrlPts[1].x,
				'cy': ctrlPts[1].y,
				'r': 4,
			})
			svgCtrlHandleStart.setAttr({
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
			svgCtrlHandleEnd.setAttr({
				'x1': ctrlPts[3].x,
				'y1': ctrlPts[3].y,
				'x2': ctrlPts[2].x,
				'y2': ctrlPts[2].y,
			})
		} else { // init...
			this.svgCtrlHandleStart = new SvgElem({
				parentDom: parentDom,
				tag: 'line',
				style: styleHandles,
				attr: {
					'x1': ctrlPts[0].x,
					'y1': ctrlPts[0].y,
					'x2': ctrlPts[1].x,
					'y2': ctrlPts[1].y,
				}
			})
			this.svgCtrlHandleEnd = new SvgElem({
				parentDom: parentDom,
				tag: 'line',
				style: styleHandles,
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
					'mousedown': this.handleCtrlPtMouseDown,
				},
				style: styleCtrlPts,
				attr: {
					'id': 'bezier-ctrl-pt-1',
					'cx': ctrlPts[1].x,
					'cy': ctrlPts[1].y,
					'r': 4,
				}
			})
			this.svgCtrlPt2 = new SvgElem({
				parentDom: parentDom,
				tag: 'circle',
				listeners: {
					'mousedown': this.handleCtrlPtMouseDown,
				},
				style: styleCtrlPts,
				attr: {
					'id': 'bezier-ctrl-pt-2',
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
