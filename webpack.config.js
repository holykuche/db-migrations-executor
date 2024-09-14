const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const DeclarationBundlerPlugin = require("types-webpack-bundler")

module.exports = {
    mode: "production",
    target: "node",
    entry: [
        path.resolve(__dirname, "index.ts"),
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
        path: path.resolve(__dirname, "dist"),
    },
    plugins: [
        // todo: need to fix
        new DeclarationBundlerPlugin({
            moduleName: "\"db-migrations-executor\"",
            out: "./index.d.ts"
        }),
        new CleanWebpackPlugin(),
    ],
};
