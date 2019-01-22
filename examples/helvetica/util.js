import React from 'react'

export const CheckBox = ({
	label,
	value,
	onClick,
	isSelected,
}) => (
	<div className="checkbox-container">
		<input type="checkbox" id={value} value={value} checked={isSelected} onChange={onClick} />
		<label htmlFor={value}>{label}</label>
	</div>
)