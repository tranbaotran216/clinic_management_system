const path = require("path");
const webpack = require("webpack");

module.exports = {
  mode: "production", 
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "./static/frontend"),
    filename: "[name].js",
    publicPath: "/",
  },
  resolve: {
    extensions: [".js", ".jsx"], 
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
    ],
  },
  devServer: {
    static: {
      directory: path.resolve(__dirname, "./static/frontend"), // chứa main.js
    },
    port: 3000,
    hot: true,
    historyApiFallback: true,
  },
  optimization: {
    minimize: true, 
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"), 
    }),
  ],
  mode: "development",
};
