const webpack = require('webpack');
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

const {
    NODE_ENV,
} = process.env;

const config = {
    entry: {
        'options/options': path.join(__dirname, 'src/options/options.tsx'),
    },
    mode: NODE_ENV === 'production' ? 'production' : 'development',
    output: {
        path: path.join(__dirname, 'build'),
        filename: '[name].js',
        // clean: true
    },
    devtool: 'cheap-module-source-map',
    module: {
        rules: [
            {
                test: /\.less$/i,
                use: [
                    {
                        loader: 'style-loader',
                    },
                    {
                        loader: 'css-loader'
                    },
                    {
                        loader: 'less-loader',
                        options: {
                            lessOptions: {
                                strictMath: true,
                            },
                        },
                    }
                ],
                exclude: /\.module\.less$/,
            },
            {
                test: /\.(js|jsx)$/,
                use: 'babel-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.ts(x)?$/,
                loader: 'ts-loader',
                exclude: /node_modules/,
            }
        ],
    },
    resolve: {
        extensions: ['.js', '.jsx', '.tsx', '.ts'],
        alias: {
            'react-dom': '@hot-loader/react-dom',
        },
    },
    devServer: {
        contentBase: './build',
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                {
                    from: 'options/*.html',
                    to: '.',
                },
            ],
        }),
    ],
};

module.exports = config;
