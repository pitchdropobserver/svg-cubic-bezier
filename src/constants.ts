import { IStyle } from './interface'

export const STYLE_BZ_CURVE: IStyle = {
	'fill': 'none',
	'stroke': 'black',
	'stroke-width': '2px',
	'z-index': '-9999',
}

export const STYLE_CTRL_PT: IStyle = {
	'fill': 'none',
	'stroke': 'black',
	'stroke-width': '2px',
}

export const STYLE_START_PT_END_PT: IStyle = {
	'fill': 'rgba(255,0,0,0.0)',
	'stroke': 'black',
	'stroke-width': '2px',
	'cursor': 'pointer',
	'z-index': '-9999',
}

export const STYLE_CTRL_LINE: IStyle = {
	'fill': 'none',
	'stroke': 'black',
	'stroke-width': '1px',
	'stroke-dasharray': '2 1',
}
