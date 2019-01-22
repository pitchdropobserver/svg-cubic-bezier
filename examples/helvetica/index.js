import React from 'react'
import ReactDom from 'react-dom'
import SvgElem from 'svg-elem'

import SvgCubicBezier from '../../src'
import Tween from '../../src/Tween'
import { CheckBox } from './util'
import { 
	TEMPLATE_W,
	TEMPLATE_H,
	TEMPLATE_OUTTER_CRVS,
	TEMPLATE_INNER_CRVS,
} from './constants'
import './styles.css'

const WIN_W = window.innerWidth
const WIN_H = window.innerHeight
const SCALE_FACTOR = 3
const TEMPLATE_LEFT = (WIN_W - TEMPLATE_W * SCALE_FACTOR) / 2
const TEMPLATE_TOP = (WIN_H - TEMPLATE_H * SCALE_FACTOR) / 2
const TEMPLATE_BOTTOM = TEMPLATE_TOP + TEMPLATE_H * SCALE_FACTOR

let mdCrvIndex // index of mousedown'd curve
let mdCtrlPtIndex // index of mousedown'ed control pt

const svg = new SvgElem({
	parentDom: document.getElementById('svg-container'),
	tag: 'svg',
	attr:{
		'width': WIN_W,
		'height': WIN_H,
	},
})

const DEFAULT_CRVS = [
	...TEMPLATE_OUTTER_CRVS,
	...TEMPLATE_INNER_CRVS,
]

const arrBezierCrvs = DEFAULT_CRVS.map((arrPts, i)=>{
	return new SvgCubicBezier({
		parentDom: svg.elem,
		ctrlPts: arrPts.map(pt => ({
			x: pt.x * SCALE_FACTOR + TEMPLATE_LEFT,
			y: pt.y * SCALE_FACTOR + TEMPLATE_TOP
		})),
		shouldShowCtrlPts: true,
		onCtrlPtMouseDown: (ctrlPtIndex, svgTarget, svgElem) => {
			mdCrvIndex = i
			mdCtrlPtIndex = ctrlPtIndex
		},
		styleCurve: {
			'stroke': 'rgb(255,255,255)',
			'stroke-width': '2.5px',
		},
		styleAnchorPts: {
			'stroke': 'rgb(255,255,255)',
			'stroke-width': '1px',
		},
		styleCtrlPts: {
			'stroke': 'rgba(255,255,255,0.5)',
			'stroke-width': '1px',
		},
		styleHandles: {
			'stroke': 'rgba(255,255,255, 0.75)',
			'stroke-width': '1px',
			'stroke-dasharray': '2 2',
		},
	}).draw()
})

document.addEventListener('mouseup', (e)=>{
	mdCrvIndex = undefined
	mdCtrlPtIndex = undefined
})

document.addEventListener('mousemove', (e)=>{
	const { clientX, clientY } = e
	if(mdCtrlPtIndex !== undefined){ // if with mousedown...
		const bezierCrv = arrBezierCrvs[mdCrvIndex]
		const updatedPts = bezierCrv.getCtrlPts()
		// splice in updated control point position...
		updatedPts.splice(mdCtrlPtIndex, 1, { x: clientX, y: clientY })
		bezierCrv.updateProps({
			ctrlPts: updatedPts		
		})
	}
})

class Anno extends React.Component {
	constructor(props){
		super(props)
		this.toggleControlPts = this.toggleControlPts.bind(this)
		this.state = {
			shouldShowCtrlPts: true
		}
	}

	toggleControlPts(){
		const shouldShowCtrlPts = !this.state.shouldShowCtrlPts
		this.setState({
			shouldShowCtrlPts,
		})
		arrBezierCrvs.forEach((crv) => {
			crv.updateProps({
				shouldShowCtrlPts,
			})
		})
	}

	resetBezierCrvs(){
		arrBezierCrvs.forEach((crv, i) => {
			crv.updateProps({
				ctrlPts: DEFAULT_CRVS[i].map(pt => ({
					x: pt.x * SCALE_FACTOR + TEMPLATE_LEFT,
					y: pt.y * SCALE_FACTOR + TEMPLATE_TOP
				}))
			}, { dur: 600 })
		})
	}
	
	render(){
		return (
			<div className="ui"
				style={{
					position: 'absolute',
					top: `${TEMPLATE_BOTTOM + 50}px`,
					textAlign: 'center',
					width: '100%',
				}}
				>
				<p className="prompt">
					Adjust handles to reshape curve.
				</p>
				<button 
					onClick={this.resetBezierCrvs}>
					reset curves
				</button>
				<CheckBox
					label="show control points"
					value="show-ctrl-pts"
					isSelected={this.state.shouldShowCtrlPts}
					onClick={this.toggleControlPts}
					/>
				<a className="source-link" href="https://github.com/pitchdropobserver/svg-cubic-bezier/blob/master/examples/helvetica/index.js">
					view source
				</a>
			</div>
		)
	}
}

ReactDom.render(
	<Anno/>,
	document.getElementById('ui-container')
)