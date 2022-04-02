const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");
const path = require("path");

module.exports = [
  {
    mode: "production",
    entry: "./src/index.ts",
    devtool: "source-map",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "mapbox-gl-draw-snap-mode.js",
      library: "mapboxGlDrawSnapMode",
      libraryTarget: "umd",
      globalObject: "this",
      // libraryExport: 'default',
    },
    resolve: {
      extensions: [".ts", ".js"],
    },
    optimization: {
      minimize: true,
      minimizer: [new TerserPlugin({ parallel: true })],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: {
            loader: "ts-loader",
          },
          exclude: /node_modules/,
        },
        {
          test: /\.m?js$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env"],
            },
          },
        },
      ],
    },
  },
];
