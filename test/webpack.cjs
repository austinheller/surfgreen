/* global require, module, __dirname */

const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
   entry: {
      'index': path.resolve('./test/contents/js/index.js'),
      'style': path.resolve('./test/contents/scss/style.scss'),
   },
   output: {
      path: path.resolve(__dirname, './build'),
      filename: '[name].min.js',
      library: {
         type: 'umd',
         name: 'app'
      }
   },
   devtool: 'inline-source-map',
   mode: "production",
   plugins: [
      new MiniCssExtractPlugin({
         filename: "[name].min.css",
      }),
   ],
   stats: 'errors-only',
   module: {
      rules: [{
            test: /\.m?js$/,
            exclude: /(node_modules|bower_components)/,
            use: {
               loader: 'babel-loader',
               options: {
                  presets: ['@babel/preset-env', '@babel/preset-react']
               }
            }
         },
         {
            test: /\.scss$/,
            use: [{
                  loader: MiniCssExtractPlugin.loader,
                  options: {
                     publicPath: "/"
                  }
               },
               {
                  loader: 'css-loader',
                  options: {
                     url: false
                  }
               },
               'sass-loader' // compiles Sass to CSS
            ]
         },
      ]
   }
};