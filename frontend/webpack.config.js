const path = require("path");
const webpack = require("webpack");

const isProduction = process.env.NODE_ENV === "production";

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
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"], 
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        type: "asset/resource", 
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: "asset/resource", 
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
      "process.env.NODE_ENV": JSON.stringify(isProduction ? "production" : "development"),
    }),
  ],
};
