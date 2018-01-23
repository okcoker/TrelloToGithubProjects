const path = require('path');
const glob = require('glob');
const webpack = require('webpack');

require('dotenv').config({
    path: path.join(__dirname, `../.env.${process.env.NODE_ENV || 'development'}`)
});

module.exports = {
    webpack: (config, { /* dev */ }) => {
        config.module.rules.push({
            test: /\.(css|scss)/,
            loader: 'emit-file-loader',
            options: {
                name: 'dist/[path][name].[ext]'
            }
        },
        {
            test: /\.css$/,
            use: ['babel-loader', 'raw-loader', 'postcss-loader']
        },
        {
            test: /\.s(a|c)ss$/,
            use: [
                'babel-loader',
                'raw-loader',
                'postcss-loader',
                {
                    loader: 'sass-loader',
                    options: {
                        includePaths: [
                            'styles',
                            'node_modules'
                        ].map((d) => {
                            return path.join(__dirname, d);
                        }).map((g) => {
                            return glob.sync(g);
                        }).reduce((a, c) => {
                            return a.concat(c);
                        }, [])
                    }
                }
            ]
        });

        config.plugins.push(new webpack.DefinePlugin({
            'process.env': {
                SITE_URL: JSON.stringify(process.env.SITE_URL),
                NODE_ENV: JSON.stringify(process.env.NODE_ENV)
            }
        }));

        return config;
    }
};
