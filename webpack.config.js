const path = require('path')
const fs = require('fs')
const HtmlWebpackPlugin = require('html-webpack-plugin') // https://github.com/jantimon/html-webpack-plugin#options

// const htmlWebpackPlugin = new HtmlWebpackPlugin({
// 	template: path.join(__dirname, 'examples/src/index.html'), 
// 	filename: './index.html', // Automatically inject a script reference to the bundle output in 
// })


const exampleNames = fs.readdirSync('./examples').filter((folderName)=>{
	return !~['lib'].indexOf(folderName)
})

const oWebpackEntries = {}
const arrHtmlWebpackPlugins = []
exampleNames.forEach((name)=>{
	oWebpackEntries[name] = path.join(__dirname,`examples/${name}`)
	arrHtmlWebpackPlugins.push(
		new HtmlWebpackPlugin({
			// inject: true,
			template: path.join(__dirname, `examples/${name}/index.html`),
			filename: `./${name}.html`, // affects path of file hosted by dev server eg. './temp/app.html' --> 'localhost:3001/temp/app.html'
			chunks: [name], // specify chunks other wise all scripts will be added to every html
		})
	)	
})

module.exports = {
	entry: oWebpackEntries,
	// entry: path.join(__dirname, 'examples/src/index.js'), // Resolve source dependencies using examples/src/index.js as a starting point
	output: {
		path: path.join(__dirname, 'examples/lib'), // does not effect dev server
		filename: '[name].bundle.js'
	},
	module: {
		rules: [ 
			{ test: /\.css$/, use: ['style-loader', 'css-loader']},
			{ test: /\.ts(x?)$/, loader: 'ts-loader' },
			{ test: /\.json$/, loader: 'json-loader' },
			{ test: /\.(js|jsx)$/, use: 'babel-loader', exclude: /node_modules/ },			
		]
	},
	plugins: arrHtmlWebpackPlugins,
	resolve: {
		extensions: ['.ts','.js','.json']
	},
	devServer: {
		// contentBase: path.join(__dirname, 'examples'),
		port: 3001 // Serve the demo on port localhost:3001
	}
}