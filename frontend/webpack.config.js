const path = require("path");
// const webpack = require("webpack"); // Không cần thiết nếu không dùng plugins đặc biệt của webpack ở đây

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === 'development';

  return {
    mode: argv.mode, // Lấy mode từ CLI (ví dụ: 'production' khi chạy build, 'development' khi chạy start)
    entry: "./src/index.js",
    output: {
      path: path.resolve(__dirname, "./static/frontend"), // Nơi 'npm run build' sẽ xuất file
      filename: "[name].js", // ví dụ: main.js
      // QUAN TRỌNG: Điều chỉnh publicPath
      // Khi dev, trỏ đến WDS. Khi prod, trỏ đến thư mục static của Django.
      publicPath: isDevelopment ? 'http://localhost:3000/' : '/static/frontend/',
      // Đặt tên cho các asset modules (ảnh, font, video...)
      // Chúng sẽ được đặt trong thư mục 'assets' so với publicPath
      // Ví dụ dev: http://localhost:3000/assets/ten_file.png
      // Ví dụ prod: /static/frontend/assets/ten_file.png
      assetModuleFilename: 'assets/[name].[hash][ext][query]'
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
        // Sử dụng asset/resource cho ảnh, font, video
        // Webpack sẽ tự động xử lý và đặt chúng vào thư mục output (theo assetModuleFilename)
        {
          test: /\.(png|jpe?g|gif|svg|ico)$/i, // Thêm ico nếu bạn dùng favicon
          type: "asset/resource",
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: "asset/resource",
        },
        {
          test: /\.(mp4|webm|ogg)$/i,
          type: "asset/resource",
        },
      ],
    },
    devServer: {
      static: {
        // Thư mục này thường chứa file index.html cơ bản nếu WDS chịu trách nhiệm serve HTML
        // Nếu Django serve HTML chính, thư mục này ít quan trọng hơn.
        directory: path.join(__dirname, 'public'), // Tạo thư mục 'public' trong 'frontend' nếu chưa có
      },
      compress: true,
      port: 3000, // Port của Webpack Dev Server
      hot: true,    // Bật Hot Module Replacement
      historyApiFallback: true, // Cho phép SPA routing, 404s sẽ fallback về index.html (hoặc path được chỉ định)
      // Headers cho phép CORS, cần thiết khi Django (8000) tải JS/assets từ WDS (3000)
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
      },
      // (Tùy chọn) Proxy API requests đến backend Django nếu cần
      // proxy: {
      //   '/api': { // Ví dụ, tất cả các request bắt đầu bằng /api
      //     target: 'http://127.0.0.1:8000', // Backend Django của bạn
      //     secure: false,
      //     changeOrigin: true,
      //   },
      //   '/quan-ly-tai-khoan': { // Proxy cho các API xác thực
      //      target: 'http://127.0.0.1:8000',
      //      secure: false,
      //      changeOrigin: true,
      //   }
      // }
    },
    optimization: {
      minimize: !isDevelopment, // Chỉ minimize code khi ở mode production
    },
    plugins: [
      // Webpack 5 tự động xử lý DefinePlugin cho process.env.NODE_ENV dựa trên 'mode'.
      // Bạn không cần tự định nghĩa lại nó trừ khi có lý do đặc biệt hoặc muốn thêm các biến env khác.
      // Nếu bạn muốn thêm các biến môi trường khác:
      // new webpack.DefinePlugin({
      //   'process.env.MY_CUSTOM_VARIABLE': JSON.stringify('some_value'),
      // })
    ],
    // Không cần khai báo 'mode' ở đây nữa vì nó đã được đặt ở đầu dựa trên argv.mode
  };
};