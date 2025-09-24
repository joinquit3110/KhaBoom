const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  mode: isProduction ? 'production' : 'development',
  entry: {
    main: './frontend/main.ts',
    course: './frontend/course.js',
    dashboard: './frontend/dashboard.ts',
  },
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: isProduction ? '[name].[contenthash].js' : '[name].js',
    chunkFilename: isProduction ? '[name].[contenthash].chunk.js' : '[name].chunk.js',
    clean: true,
    publicPath: '/',
  },
  resolve: {
    extensions: ['.ts', '.js', '.scss', '.css'],
    alias: {
      '@': path.resolve(__dirname, 'frontend'),
      'shared': path.resolve(__dirname, 'content/shared'),
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'esbuild-loader',
          options: {
            loader: 'ts',
            target: 'es2016',
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.scss$/,
        use: [
          isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  ['autoprefixer'],
                  ...(isProduction ? [['cssnano', { preset: 'default' }]] : []),
                ],
              },
            },
          },
          'sass-loader',
        ],
      },
      {
        test: /\.css$/,
        use: [
          isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
          'css-loader',
          'postcss-loader',
        ],
      },
      {
        test: /\.(png|jpe?g|gif|svg|webp)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'images/[name].[contenthash][ext]',
        },
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024, // 8kb
          },
        },
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name].[contenthash][ext]',
        },
      },
    ],
  },
  plugins: [
    ...(isProduction ? [
      new MiniCssExtractPlugin({
        filename: '[name].[contenthash].css',
        chunkFilename: '[name].[contenthash].chunk.css',
      }),
      new CompressionPlugin({
        algorithm: 'gzip',
        test: /\.(js|css|html|svg)$/,
        threshold: 8192,
        minRatio: 0.8,
      }),
      new CompressionPlugin({
        algorithm: 'brotliCompress',
        test: /\.(js|css|html|svg)$/,
        compressionOptions: {
          params: {
            [require('zlib').constants.BROTLI_PARAM_QUALITY]: 11,
          },
        },
        threshold: 8192,
        minRatio: 0.8,
        filename: '[path][base].br',
      }),
      // Uncomment to analyze bundle size
      // new BundleAnalyzerPlugin(),
    ] : []),
  ],
  optimization: {
    minimize: isProduction,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: isProduction,
            drop_debugger: isProduction,
            pure_funcs: isProduction ? ['console.log', 'console.info'] : [],
          },
          mangle: {
            safari10: true,
          },
        },
        extractComments: false,
      }),
      new CssMinimizerPlugin({
        minimizerOptions: {
          preset: ['default', {
            discardComments: { removeAll: true },
          }],
        },
      }),
    ],
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          chunks: 'all',
        },
        mathigon: {
          test: /[\\/]node_modules[\\/]@mathigon[\\/]/,
          name: 'mathigon',
          priority: 20,
          chunks: 'all',
        },
        common: {
          name: 'common',
          minChunks: 2,
          priority: 5,
          chunks: 'all',
          enforce: true,
        },
      },
    },
    runtimeChunk: 'single',
  },
  performance: {
    maxEntrypointSize: 250000,
    maxAssetSize: 250000,
    hints: isProduction ? 'warning' : false,
  },
  devtool: isProduction ? 'source-map' : 'eval-source-map',
  cache: {
    type: 'filesystem',
    cacheDirectory: path.resolve(__dirname, '.cache/webpack'),
  },
};