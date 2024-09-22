const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = {
    mode: "production",
    target: "node",
    entry: [
        path.resolve(__dirname, "src", "index.ts"),
    ],
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: "ts-loader",
                exclude: /node_modules/
            },
        ],
    },
    resolve: {
        modules: [
            path.resolve(__dirname, "src"),
            path.resolve(__dirname, "node_modules"),
        ],
        extensions: [ '.js', ".ts" ]
    },
    output: {
        filename: "index.js",
        path: path.resolve(__dirname, "dist", "lib"),
    },
    plugins: [
        new CleanWebpackPlugin(),
    ],
};
