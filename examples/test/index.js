import React from 'react'
import ReactDom from 'react-dom'
import SvgElem from 'svg-elem'
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
	render(){
		return (
			<div className="ui">
				why are you running
			</div>
		)
	}
}

ReactDom.render(
	<UI/>,
	document.getElementById('ui-container')
)