import React from 'react'
import ReactDom from 'react-dom'
import SvgElem from 'svg-elem'
import { CheckBox } from './util'
import SvgCubicBezier from '../../src'
import './styles.css'
const WIN_W = window.innerWidth
const WIN_H = window.innerHeight


let mdCtrlPtIndex // index of mousedown'ed control pt

const svg = new SvgElem({
	parentDom: document.getElementById('svg-container'),
	tag: 'svg',
	attr:{
		'width': WIN_W,
		'height': WIN_H,
	},
})

const bezier = new SvgCubicBezier({
	parentDom: svg.elem,
	ctrlPts: [
		{ x: WIN_W / 2 - 100, y: WIN_H / 2 - 100 },
		{ x: WIN_W / 2 + 100, y: WIN_H / 2 + 100 },
	],
	styleCurve: {
		'stroke': 'rgb(255,255,255)',
		'stroke-width': '2px',
	},
	styleAnchorPts:{
		'stroke': 'rgb(255,255,255)',
		'stroke-width': '2px',
	},
	styleCtrlPts:{
		'stroke': 'rgb(255,255,255)',
		'stroke-width': '2px',
	},
	styleHandles:{
		'stroke': 'rgb(255,255,255)',
		'stroke-width': '1px',
		'stroke-dasharray': '2 2',
	},
	shouldShowCtrlPts: true,
	onCtrlPtClick: (ctrlPtIndex, svgTarget, svgElem)=>{
		mdCtrlPtIndex = ctrlPtIndex
	}
}).calc().draw()


document.addEventListener('mouseup', (e)=>{
	mdCtrlPtIndex = undefined
})

document.addEventListener('mousemove', (e)=>{
	const { clientX, clientY } = e
	if(mdCtrlPtIndex !== undefined){ // if with mousedown...
		const updatedPts = bezier.getCtrlPts()
		updatedPts.splice(mdCtrlPtIndex, 1, { x: clientX, y: clientY })
		bezier.updateProps({
			ctrlPts: updatedPts		
		})
	}
})


class UI extends React.Component {
	constructor(props){
		super(props)
		this.state = {
			shouldShowCtrlPts: true
		}
	}
	render(){
		const {
			shouldShowCtrlPts,
		} = this.state
		return (
			<div className="ui">
				<CheckBox
					label="show control points"
					value="show-ctrl-pts"
					isSelected={this.state.shouldShowCtrlPts}
					onClick={()=>{
						const shouldShowCtrlPts = !this.state.shouldShowCtrlPts
						this.setState({
							shouldShowCtrlPts,
						})
						bezier.updateProps({
							shouldShowCtrlPts,
						})
					}}
					/>
			</div>
		)
	}
}

ReactDom.render(
	<UI/>,
	document.getElementById('ui-container')
)