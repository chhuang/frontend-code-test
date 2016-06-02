module.exports = {
  context: __dirname + '/react',
  entry: './app.js',
  output: {
    path: __dirname + '/react/public',
    filename: 'app.js'
  },
  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel' }
    ]
  }
}