const dotenv = require('dotenv');
const Trello = require('node-trello');
const GitHubApi = require('github');

dotenv.config();

const trello = new Trello(process.env.TRELLO_KEY, process.env.TRELLO_TOKEN);
const github = new GitHubApi({
    timeout: 5000,
    // host: 'api.github.com',
    // pathPrefix: '/api/v3',
    headers: {
        Accept: 'application/vnd.github.inertia-preview+json'
    },
    protocol: 'https'
});

github.authenticate({
    type: 'token',
    token: process.env.GITHUB_PERSONAL_TOKEN
});

function getAllCards() {
    return new Promise((resolve, reject) => {
        const options = {
            attachments: 'true',
            checkItemStates: 'true',
            checklists: 'all'
        };

        trello.get(`/1/boards/${process.env.TRELLO_BOARD_ID}/cards`, options, (err, data) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(data);
        });
    });
}

function getAllLists() {
    return new Promise((resolve, reject) => {
        trello.get(`/1/boards/${process.env.TRELLO_BOARD_ID}/lists`, (err, data) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(data);
        });
    });
}

function createOrgProject() {
    return github.projects.createOrgProject({
        org: process.env.GITHUB_ORG,
        name: 'trello-to-projects-script'
    });
}

function getCheckboxMarkdown(text, completed = false) {
    return `- [${completed ? 'x' : ' '}] ${text}`;
}

function getImageMarkdown(src, text = '') {
    return `![${text || src}](${src})`;
}

function createNoteBodyFromTrelloCard(card) {
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

    return [card.name, attachments, checklists].filter(Boolean).join('\n');
}

async function main() {
    try {
        const [allLists, cards] = await Promise.all([
            getAllLists(),
            getAllCards()
        ]);
        const filteredLists = cards.reduce((lists, card) => {
            lists[card.idList] = lists[card.idList] || [];
            lists[card.idList].push(card);
            return lists;
        }, {});

        const project = await createOrgProject();
        const columnCreationPromises = allLists.map((list) => {
            const id = list.id;

            return github.projects.createProjectColumn({
                'project_id': project.data.id,
                name: list.name
            }).then((column) => {
                const cardsForColumn = Array.from(filteredLists[id]).reverse();
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
    }
    catch (err) {
        console.log(err);
    }
}

main();
