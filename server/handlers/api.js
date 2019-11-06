import GitHubApi from 'github';
import Trello from 'node-trello';

function getBoards(trello) {
    return new Promise((resolve, reject) => {
        trello.get('/1/member/me/boards', (err, data) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(data);
        });
    });
}

function getLists(trello, boardId) {
    return new Promise((resolve, reject) => {
        trello.get(`/1/boards/${boardId}/lists`, (err, data) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(data);
        });
    });
}

function getAllCards(trello, boardId) {
    return new Promise((resolve, reject) => {
        const options = {
            attachments: 'true',
            checkItemStates: 'true',
            checklists: 'all'
        };

        trello.get(`/1/boards/${boardId}/cards`, options, (err, data) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(data);
        });
    });
}

function getCard(trello, cardId) {
    return new Promise((resolve, reject) => {
        const options = {
            attachments: 'true',
            checkItemStates: 'true',
            checklists: 'all'
        };

        trello.get(`/1/cards/${cardId}`, options, (err, data) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(data);
        });
    });
}

function getCardActions(trello, cardId) {
    return new Promise((resolve, reject) => {
        const options = {
            filter: 'commentCard'
        };

        trello.get(`/1/cards/${cardId}/actions`, options, (err, data) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(data);
        });
    });
}

function createOrgProject(organizationName, projectName) {
    return github.projects.createOrgProject({
        org: organizationName,
        name: projectName
    });
}

function transcriptFromActions(actions) {
    return Array.from(actions).reverse().map((action) => {
        return `**${action.memberCreator.fullName}**

> ${action.data.text}
`;
    }).join('\n');
}

function getCheckboxMarkdown(text, completed = false) {
    return `- [${completed ? 'x' : ' '}] ${text}`;
}

function getImageMarkdown(src, text = '') {
    return `![${text || src}](${src})`;
}

function createNoteBodyFromTrelloCard(card, { excludeTitle = false } = {}) {
    const attachments = card.attachments.map((obj) => {
        return getImageMarkdown(obj.url);
    }).join('\n');
    const checklists = card.checklists.map((list) => {
        const title = `### ${list.name}`;
        const checkboxes = list.checkItems.map((item) => {
            return getCheckboxMarkdown(item.name, item.state === 'complete');
        }).join('\n');

        return `${title}

${checkboxes}
`;
    }).join('\n');

    const parts = [attachments, checklists];

    if (card.desc) {
        parts.unshift(card.desc);
    }

    if (!excludeTitle) {
        parts.unshift(card.name);
    }

    return parts.filter(Boolean).join('\n');
}

function getProjectInfo(listInfo, listIdToCardsMap) {
    const listIdToName = listInfo.reduce((obj, listObj) => {
        obj[listObj.id] = listObj.destinationName;
        return obj;
    }, {});

    const nameToCardsMap = Object.keys(listIdToCardsMap).reduce((obj, listId) => {
        const name = listIdToName[listId];

        obj[name] = obj[name] || [];
        obj[name] = obj[name].concat(listIdToCardsMap[listId]);

        return obj;
    }, {});

    return Object.keys(nameToCardsMap).reduce((obj, name) => {
        const cards = nameToCardsMap[name];

        obj[name] = Array.from(cards).sort((x, y) => {
            const firstDate = new Date(x.dateLastActivity);
            const secondDate = new Date(y.dateLastActivity);

            return secondDate - firstDate;
        });

        return obj;
    }, {});
}

const github = new GitHubApi({
    timeout: 5000,
    // host: 'api.github.com',
    // pathPrefix: '/api/v3',
    headers: {
        Accept: 'application/vnd.github.inertia-preview+json'
    },
    protocol: 'https'
});

export default async function handler(req, res, next) {
    try {
        const action = req.params.action;
        const { trelloKey, trelloSecret } = req.cookies;
        const key = (req.body.key || trelloKey || '').trim();
        const secret = (req.body.secret || trelloSecret || '').trim();
        const token = (req.body.token || req.cookies.githubToken || '').trim();

        let trello = {};

        // The following 2 try/catch blocks are only needed for first
        // initialization of the app. Maybe it'd be better if we combined
        // the verify call into one.
        try {
            // Dont let empty trello creds fail github
            trello = new Trello(key, secret);

            if (!req.cookies.trelloSecret && !req.cookies.trelloKey) {
                res.cookie('trelloSecret', secret, {
                    path: '/',
                    secure: process.env.NODE_ENV === 'production'
                });
                res.cookie('trelloKey', key, {
                    path: '/',
                    secure: process.env.NODE_ENV === 'production'
                });
            }
        }
        catch (err) {} //eslint-disable-line

        try {
            // Don't let github fail trello requests
            github.authenticate({
                type: 'token',
                token
            });

            if (!req.cookies.githubToken) {
                res.cookie('githubToken', token, {
                    path: '/',
                    secure: process.env.NODE_ENV === 'production'
                });
            }
        }
        catch (err) {} // eslint-disable-line

        switch (action) {
            case 'verifyGithub': {
                try {
                    await github.users.getOrgs({});

                    res.status(200).json({
                        success: true
                    });
                }
                catch (err) {
                    res.status(401).end('');
                }
                break;
            }

            case 'organizations': {
                const orgs = await github.users.getOrgs({});

                res.status(200).json(orgs);
                break;
            }

            case 'projects': {
                const result = await github.projects.getOrgProjects({
                    org: req.query.organization
                });

                res.status(200).json(result);
                break;
            }

            case 'verifyTrello': {
                try {
                    await getBoards(trello);

                    res.status(200).json({
                        success: true
                    });
                }
                catch (err) {
                    res.status(401).end('');
                }
                break;
            }

            case 'boards': {
                const boards = await getBoards(trello);

                res.status(200).json(boards);
                break;
            }

            case 'lists': {
                const lists = await getLists(trello, req.query.boardId);

                res.status(200).json(lists);
                break;
            }

            case 'repos': {
                const result = await github.activity.getWatchedRepos({
                    // If they have more than 100 then this will need to be
                    // revisited
                    'per_page': 100
                });

                res.status(200).json(result);
                break;
            }

            case 'cards': {
                const boardId = req.query.boardId;
                const cards = await getAllCards(trello, boardId);

                res.status(200).json(cards);
                break;
            }

            case 'markdown': {
                const [card, actions] = await Promise.all([
                    getCard(trello, req.query.cardId),
                    getCardActions(trello, req.query.cardId)
                ]);

                const markdown = [createNoteBodyFromTrelloCard(card, { excludeTitle: true }), transcriptFromActions(actions)].join('\n');

                res.status(200).json({
                    markdown
                });
                break;
            }

            case 'createIssue': {
                const [card, actions] = await Promise.all([
                    getCard(trello, req.body.cardId),
                    getCardActions(trello, req.body.cardId)
                ]);
                const markdown = [createNoteBodyFromTrelloCard(card, { excludeTitle: true }), transcriptFromActions(actions)].join('\n');

                const result = await github.issues.create({
                    owner: req.body.owner,
                    repo: req.body.name,
                    title: card.name,
                    body: markdown
                });

                res.status(200).json(result);
                break;
            }

            case 'migrate': {
                const listInfo = req.body.lists;
                const organizationName = req.body.organizationName;
                const boardId = req.body.boardId;
                let project = req.body.project;

                const cards = await getAllCards(trello, boardId);
                const emptyListObj = listInfo.reduce((obj, listObj) => {
                    obj[listObj.id] = [];
                    return obj;
                }, {});
                const listIdToCardsMap = cards.reduce((lists, card) => {
                    if (typeof lists[card.idList] !== 'undefined') {
                        lists[card.idList].push(card);
                    }
                    return lists;
                }, emptyListObj);
                const mergedLists = getProjectInfo(listInfo, listIdToCardsMap);

                if (project.id === 'new') {
                    const newProject = await createOrgProject(organizationName, project.name);

                    project = {
                        ...project,
                        ...newProject.data
                    };
                }

                const columnCreationPromises = Object.keys(mergedLists).map((name) => {
                    return github.projects.createProjectColumn({
                        'project_id': project.id,
                        name: name
                    }).then((column) => {
                        const cardsForColumn = Array.from(mergedLists[name]).reverse();
                        let promise = Promise.resolve();

                        cardsForColumn.forEach((card) => {
                            promise = promise.then(() => {
                                const maxLimit = 1024;
                                let note = createNoteBodyFromTrelloCard(card);

                                if (note.length > maxLimit) {
                                    const message = `\nNote truncated. See original (${card.url})`;

                                    note = note.substr(0, maxLimit - message.length) + message;
                                }
                                return github.projects.createProjectCard({
                                    'column_id': column.data.id,
                                    note: note
                                });
                            });
                        });

                        return promise;
                    });
                });

                await Promise.all(columnCreationPromises);

                res.status(200).json(project);
                break;
            }

            default:
                res.status(400).send('Bad request');
                return;
        }
    }
    catch (err) {
        next(err);
        return;
    }
}
