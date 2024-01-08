const path = require("path");
const webpack = require("webpack");
const HtmlBundlerPlugin = require("html-bundler-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
// const WorkboxPlugin = require('workbox-webpack-plugin');
// const CopyPlugin = require("copy-webpack-plugin");


class MonkeyPatchPlugin {
    constructor(basePath, enabled) {
        this.basePath = basePath
        this.enabled = enabled
    }
    apply(compiler) {
        compiler.hooks.compilation.tap(
            "MonkeyPatchPlugin",
            (compilation, { normalModuleFactory }) => {
                normalModuleFactory.hooks.resolve
                    .tap("MonkeyPatchPlugin", (data) => {
                        const match = /https?:\/\/vyxal.github.io\/Vyxal\/(.*\.txt)/.exec(data.request)
                        if (match != null && this.enabled) {
                            data.request = path.join("/", this.basePath, match[1])
                        }
                    })
            }
        )
    }
}

module.exports = function (env, argv) {
    const prod = argv.mode == "production"
    return [{
        name: "theseus",
        mode: prod ? "production" : "development",
        devtool: false,
        experiments: {
            outputModule: true,
            buildHttp: {
                allowedUris: ["https://vyxal.github.io"],
                cacheLocation: false,
                frozen: false, // the docs can"t tell ME what to do!
            }
        },
        plugins: [
            new MonkeyPatchPlugin(env["vy-archive"], env["vy-archive"] != undefined),
            new HtmlBundlerPlugin({
                entry: [
                    {
                        import: "./src/latest/latest.html",
                        filename: "latest.html"
                    }
                ],
                js: {
                    filename: "[name].[contenthash:8].js"
                },
                css: {
                    filename: "[name].[contenthash:8].css",
                },
                // preload: [
                //     {
                //         test: /\.(ttf|woff2?)$/i,
                //         attributes: { as: "font", crossorigin: true }
                //     },
                //     {
                //         test: /\.png$/,
                //         as: "image"
                //     }
                // ]
            }),
            // new CopyPlugin({
            //     patterns: [
            //         { from: "src/latest/assets/pwa/", to: "pwa" },
            //     ],
            // }),
            prod ? (
                new webpack.SourceMapDevToolPlugin({
                    filename: "[file].map[query]",
                    exclude: [/style.*\.css$/],
                })
            ) : (
                new webpack.EvalSourceMapDevToolPlugin({
                    // exclude: [/style.*\.css$/],
                })
            ),
            // new WorkboxPlugin.InjectManifest({
            //     swSrc: "./src/latest/js/service.ts",
            //     exclude: [/\.map$/, /^manifest.*\.js$/, /\.html$/, /style.*\.css$/]
            // }),
        ],
        resolve: {
            extensions: [".tsx", ".ts", ".js"],
            alias: {
                "https://vyxal.github.io/Vyxal/ShortDictionary.txt": "https://vyxal.github.io/Vyxal/sus.txt"
            }
        },
        externals: [
            function ({ context, request, dependencyType, contextInfo, getResolve }, callback) {
                let match = /https?:\/\/vyxal.github.io\/Vyxal\/(.*\.(js))/.exec(request)
                if (match) {
                    if (env["vy-archive"] != undefined) {
                        return callback(null, path.join("/", env["vy-archive"], match[1]), "import")
                    }
                    return callback(null, request, "import")
                }
                callback()
            }
        ],
        output: {
            clean: true,
            sourceMapFilename: "[file].map",
        },
        optimization: {
            runtimeChunk: "single",
            splitChunks: {
                maxSize: 200000,
                cacheGroups: {
                    vendor: {
                        test: /[\\/]node_modules[\\/].+\.(js|ts)$/,
                        name(module, chunks, cacheGroupKey) {
                            let segs = module.identifier().split("/")
                            return `vendor/${segs.slice(segs.lastIndexOf("node_modules") + 1).join("-")}`
                        },
                        chunks: "all",
                        reuseExistingChunk: true
                    },
                },
            },
            minimizer: [
                new CssMinimizerPlugin(),
                new TerserPlugin()
            ],
        },
        module: {
            rules: [
                {
                    test: /\.css$/i,
                    use: ["css-loader"],
                },
                {
                    test: /\.s[ac]ss$/i,
                    use: ["css-loader", "sass-loader"],
                },
                {
                    test: /\.tsx?$/,
                    exclude: /node_modules/,
                    use: "ts-loader"
                },
                {
                    test: /\.(txt|json)$/,
                    type: "asset/resource"
                },
                {
                    test: /\.(woff2|woff)$/,
                    type: "asset/resource",
                    generator: {
                        filename: "fonts/[name][ext]",
                    },
                },
                {
                    test: /\.(png|svg|jpg|jpeg|gif)$/i,
                    type: "asset/resource",
                    generator: {
                        filename: "img/[name][ext]",
                    },
                },
                {
                    test: /\.ico$/,
                    type: "asset/resource",
                    generator: {
                        filename: "[name][ext]"
                    }
                },
                {
                    test: /\.handlebars(.md)?$/i,
                    type: "asset/source",
                },
            ],
        },
    }];
}
