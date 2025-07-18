// frontend/webpack.config.js

const path = require("path");
const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin"); // 1. Import plugin

const isProduction = process.env.NODE_ENV === "production";

module.exports = {
  mode: isProduction ? "production" : "development",
  entry: "./src/index.js",
  output: {
    // 2. Build vào một thư mục 'dist' cho sạch sẽ
    path: path.resolve(__dirname, "dist"), 
    filename: "main.js",
    publicPath: "/",
    // Xóa các file cũ trước mỗi lần build
    clean: true, 
  },
  resolve: {
    extensions: [".js", ".jsx"],
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: "babel-loader",
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader, // 3. Thay thế style-loader
          "css-loader",
        ],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif|woff|woff2|eot|ttf|otf)$/i,
        type: "asset/resource",
      },
    ],
  },
  devServer: {
    static: {
      directory: path.resolve(__dirname, "dist"),
    },
    port: 3000,
    hot: true,
    historyApiFallback: true,
  },
  optimization: {
    minimize: isProduction,
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
    }),
    // 4. Thêm plugin vào đây
    new MiniCssExtractPlugin({
      filename: 'styles.css', // Đặt tên file CSS đầu ra
    }),
  ],
};