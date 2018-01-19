import React from 'react';
import Document, { Head, Main, NextScript } from 'next/document';
import { ServerStyleSheet } from 'styled-components';
import globalStyles from '../styles/index.scss';

export default class MyDocument extends Document {
    render() {
        const sheet = new ServerStyleSheet();
        const main = sheet.collectStyles(<Main />);
        const styleTags = sheet.getStyleElement();

        const description = 'Easily migrate from Trello to GitHub Projects';
        const siteTitle = 'Trello to Projects';
        const socialThumb = `${process.env.SITE_URL}/static/favicon.png`;

        return (
            <html>
                <Head>
                    <title>{siteTitle}</title>
                    <link href="https://fonts.googleapis.com/css?family=Montserrat:400,700" rel="stylesheet" />
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                    <link rel="apple-touch-icon" sizes="180x180" href="/static/apple-touch-icon.png" />
                    <link rel="icon" type="image/png" sizes="32x32" href="/static/favicon-32x32.png" />
                    <link rel="icon" type="image/png" sizes="16x16" href="/static/favicon-16x16.png" />
                    <link rel="manifest" href="/static/manifest.json" />
                    <link rel="mask-icon" href="/static/safari-pinned-tab.svg" color="#5bbad5" />
                    <meta name="theme-color" content="#ffffff" />

                    <meta name="twitter:card" content="summary" />
                    <meta name="twitter:url" content={process.env.SITE_URL} />
                    <meta name="twitter:title" content={siteTitle} />
                    <meta name="twitter:image:src" content={socialThumb} />
                    <meta name="twitter:description" content={description} />
                    <meta name="og:type" content="website" />
                    <meta name="og:site_name" content={siteTitle} />
                    <meta property="og:image" content={socialThumb} />
                    <meta name="description" content={description} />
                    <meta name="keywords" content="GitHub, Projects, Trello, Project Management" />

                    <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
                    {styleTags}
                </Head>
                <body>
                    <div className="root">
                        {main}
                    </div>
                    <NextScript />
                </body>
            </html>
        );
    }
}
