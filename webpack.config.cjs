const path = require("path");
const webpack = require("webpack");
const HtmlBundlerPlugin = require("html-bundler-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const { GitRevisionPlugin } = require('git-revision-webpack-plugin')
// const WorkboxPlugin = require('workbox-webpack-plugin');
// const CopyPlugin = require("copy-webpack-plugin");

const gitRevisionPlugin = new GitRevisionPlugin()

const LATEST_DATA_URI = "https://vyxal.github.io/Vyxal"

module.exports = function (env, argv) {
    const prod = argv.mode == "production"
    return [{
        name: "theseus",
        mode: prod ? "production" : "development",
        devtool: false,
        experiments: {
            outputModule: true,
        },
        plugins: [
            new HtmlBundlerPlugin({
                entry: env["vy-archive"] != undefined ? (
                    [
                        {
                            import: "./src/latest/latest.html",
                            filename: "index.html"
                        },
                    ]
                ) : (
                    [
                        {
                            import: "./src/latest/latest.html",
                            filename: "latest.html"
                        },
                        {
                            import: "./src/index/index.hbs",
                            filename: "index.html"
                        },
                        {
                            import: "./src/versions/versions.hbs",
                            filename: "versions.html"
                        }
                    ]
                ),
                js: {
                    filename: "scripts/[name].[contenthash:8].js"
                },
                css: {
                    filename: "styles/[name].[contenthash:8].css",
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
                preprocessor: "handlebars",
                preprocessorOptions: {
                    partials: [
                        "src/common/templates/"
                    ]
                }
            }),
            // new CopyPlugin({
            //     patterns: [
            //         { from: "src/latest/assets/pwa/", to: "pwa" },
            //     ],
            // }),
            prod ? (
                new webpack.SourceMapDevToolPlugin({
                    filename: "maps/[base].map[query]",
                    exclude: [/style.*\.css$/],
                })
            ) : (
                new webpack.EvalSourceMapDevToolPlugin({
                    // exclude: [/style.*\.css$/],
                })
            ),
            new webpack.DefinePlugin({
                VERSION: JSON.stringify(gitRevisionPlugin.version()),
                DATA_URI: JSON.stringify(env["vy-archive"] != undefined ? path.join(".", env["vy-archive"]) : LATEST_DATA_URI),
                PRODUCTION: JSON.stringify(prod),
            })
            // new WorkboxPlugin.InjectManifest({
            //     swSrc: "./src/latest/js/service.ts",
            //     exclude: [/\.map$/, /^manifest.*\.js$/, /\.html$/, /style.*\.css$/]
            // }),
        ],
        resolve: {
            extensions: [".tsx", ".ts", ".js"],
        },
        externals: [
            function ({ context, request, dependencyType, contextInfo, getResolve }, callback) {
                let match = /https?:\/\/vyxal.github.io\/Vyxal\/(.*\.(js))/.exec(request)
                if (match) {
                    if (env["vy-archive"] != undefined) {
                        return callback(null, `../${env["vy-archive"]}/${match[1]}`, "import")
                    }
                    return callback(null, request, "import")
                }
                callback()
            }
        ],
        output: {
            clean: true,
            filename: "scripts/[name].[contenthash:8].js",
            chunkFilename: "scripts/[name].[chunkhash:8].js"
            // sourceMapFilename: "[file].map",
        },
        optimization: {
            runtimeChunk: "single",
            splitChunks: {
                maxSize: 200000,
                cacheGroups: {
                    vendor: {
                        test: /[\\/]node_modules[\\/].+\.(js|ts)$/,
                        name(module, chunks, cacheGroupKey) {
                            let segs = module.identifier().split(path.sep)
                            return `vendor/${segs.slice(segs.lastIndexOf("node_modules") + 1).join("-").slice(0, -3)}`
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
                    test: /\.grammar$/i,
                    use: "lezer-loader",
                },
                {
                    test: /\.(txt|json|vyl?)$/,
                    type: "asset/resource"
                },
                {
                    resourceQuery: /raw/,
                    type: "asset/source",
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
        ignoreWarnings: [
            // TODO: Remove these once Bootstrap 5.3.4 releases
            /https:\/\/sass-lang.com\/d\/mixed-decls/,
            /\d+ repetitive deprecation warnings omitted\./,
        ]
    }];
}
