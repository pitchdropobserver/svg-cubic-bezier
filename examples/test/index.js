import React from 'react'
import ReactDom from 'react-dom'
import SvgElem from 'svg-elem'
import SvgCubicBezier from '../../src'
import './styles.css'
const WIN_W = window.innerWidth
const WIN_H = window.innerHeight


const svg = new SvgElem({
	parentDom: document.getElementById('root'),
	tag: 'svg',
	attr:{
		'width': WIN_W,
		'height': WIN_H,
	},
	style:{
		'background': '#eee',
	}
})

const bezier = new SvgCubicBezier({
	parentDom: svg.elem,
	startPt: { x:50, y:50 },
	endPt: { x:350, y:350 },
	shouldDrawHelpers: true,
}).calc().draw()


ReactDom.render(
	<App/>,
	document.getElementById('root')
)