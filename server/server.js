import path from 'path';
import express from 'express';
import next from 'next';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import hpp from 'hpp';
import helmet from 'helmet';
import favicon from 'serve-favicon';
import httpsRedirect from 'express-https-redirect';

import apiHandler from './handlers/api';

const port = parseInt(process.env.PORT, 10) || 4000;
const isDev = process.env.NODE_ENV !== 'production';
const nextServer = next({ dev: isDev });
const nextServerHandler = nextServer.getRequestHandler();

nextServer.prepare().then(() => {
    const app = express();
    const staticPath = path.join(__dirname, '../static');

    app.disable('x-powered-by');

    app.use('/', httpsRedirect());

    app.use(favicon(path.join(staticPath, 'favicon.ico')));

    app.use('/static', express.static(staticPath));

    app.use(bodyParser.json({ limit: '5mb' }));
    app.use(bodyParser.urlencoded({ limit: '5mb', extended: false }));
    app.use(cookieParser());
    app.use(hpp());
    app.use(helmet({
        hsts: {
            force: !isDev
        },
        frameguard: {
            action: 'sameorigin'
        }
    }));

    app.use('/api/:action', apiHandler);

    app.get('*', (req, res) => {
        return nextServerHandler(req, res);
    });

    app.listen(port, (err) => {
        if (err) {
            throw err;
        }

        if (isDev) {
            const ip = require('ip');

            console.log(`
Localhost: ⌨  http://localhost:${port}
LAN: ☎️  http://${ip.address()}:${port}

Press 'CTRL-C' to stop
`);
        }
    });
    return;
}).catch((err) => console.log(err));
