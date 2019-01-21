import React from 'react'
import ReactDom from 'react-dom'
import SvgElem from 'svg-elem'
import { CheckBox } from './util'
import SvgCubicBezier from '../../src'
import './styles.css'
const WIN_W = window.innerWidth
const WIN_H = window.innerHeight


let mousedownPtIndex

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
		{ x: 50, y: 50 },
		{ x: 350, y: 350 },
	],
	shouldDrawHelpers: true,
	onCtrlPtClick: (ctrlPtIndex, svgTarget, svgElem)=>{
		mousedownPtIndex = ctrlPtIndex
		console.log('mousedownPtIndex', mousedownPtIndex)
	}
}).calc().draw()


document.addEventListener('mouseup', (e)=>{
	mousedownPtIndex = undefined
})
document.addEventListener('mousemove', (e)=>{
	const { clientX, clientY } = e
	if(mousedownPtIndex !== undefined){
		const updatedPts = bezier.getCtrlPts()
		updatedPts.splice(mousedownPtIndex, 1, { x: clientX, y: clientY })
		console.log('updatedPts', updatedPts)
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
						this.setState({
							shouldShowCtrlPts: !this.state.shouldShowCtrlPts
						})

						bezier.updateProps({
							shouldDrawHelpers: !bezier.props.shouldDrawHelpers
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