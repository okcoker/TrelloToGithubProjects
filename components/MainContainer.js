import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { getBoards, setCurrentBoardId, getLists, setListCheckState, resetListDestinationNames, setListDestinationNameIndex, addNewDestinationList } from '../redux/ducks/trello';
import { getOrganizations, setOrganizationId, getProjects, setProjectId, addNewProject, performMigration } from '../redux/ducks/github';

import Select from './Select';
import Loader from './Loader';
import CardConverterContainer from './CardConverterContainer';

class MainContainer extends Component {
    static propTypes = {
        dispatch: PropTypes.func,
        github: PropTypes.object,
        trello: PropTypes.object
    }

    constructor(props) {
        super(props);

        this.state = {
            keepColumnNames: true,
            showCardConverter: false
        };
    }

    componentDidMount() {
        const { dispatch } = this.props;

        dispatch(getBoards()).then((action) => {
            dispatch(getLists(action.resolved[0].id));
            return;
        }).catch((err) => {
            console.log(err);
        });

        dispatch(getOrganizations()).then((action) => {
            const firstProject = action.resolved.data[0];

            if (firstProject) {
                dispatch(getProjects(firstProject.login));
            }
            return;
        }).catch((err) => {
            console.log(err);
        });
    }

    ////////////////////
    // Event handlers //
    ////////////////////

    handleSelectChange = (e) => {
        const { dispatch, github, trello } = this.props;
        const select = e.currentTarget;
        const name = select.name;
        const value = select.options[select.selectedIndex].value;

        switch (name) {
            case 'board':
                dispatch(setCurrentBoardId(value));
                dispatch(getLists(value));
                break;

            case 'organization': {
                // Retrieve organization
                const organization = github.organizations.find(
                    (item) => item.id === parseInt(value, 10)
                );

                // Set ID and refresh projects
                dispatch(setOrganizationId(value));
                dispatch(getProjects(organization.login));
                break;
            }

            case 'project': {
                if (value === 'add') {
                    const newName = this.getPromptValue(
                        'Enter name for new project name (will be created upon migration)',
                        'This project name already exists. Please enter another.',
                        github.projects.map((project) => {
                            return project.name;
                        })
                    );

                    if (newName) {
                        dispatch(addNewProject(newName));
                    }
                    return;
                }
                dispatch(setProjectId(value));
                break;
            }

            case 'destinationList': {
                const listIndex = select.getAttribute('data-index');
                // Minus 1 for the create new option
                const nameIndex = select.selectedIndex - 1;

                if (value === 'add') {
                    const newName = this.getPromptValue(
                        'Enter name for new list name',
                        'This list already exists. Please enter another.',
                        trello.lists.map((list) => {
                            return list.name;
                        })
                    );

                    if (newName) {
                        const newNameIndex = trello.destinationListNames.length;

                        dispatch(addNewDestinationList(newName));
                        dispatch(setListDestinationNameIndex(listIndex, newNameIndex));
                    }
                    return;
                }

                dispatch(setListDestinationNameIndex(listIndex, nameIndex));
                break;
            }

            default:
                break;
        }
    }

    handleCheckboxChange = (e) => {
        const { dispatch } = this.props;
        const input = e.currentTarget;
        const name = input.name;
        const value = input.value;
        const checked = input.checked;

        switch (name) {
            case 'list':
                dispatch(setListCheckState(value, checked));
                break;

            default:
                break;
        }
    }

    handleColumnNameCheck = () => {
        const { dispatch } = this.props;

        this.setState((prevState) => {
            const newState = !prevState.keepColumnNames;

            if (newState) {
                dispatch(resetListDestinationNames());
            }

            return {
                ...prevState,
                keepColumnNames: newState
            };
        });
    }

    handleMigrationFormSubmit = (e) => {
        e.preventDefault();

        const { dispatch, github, trello } = this.props;
        const organization = github.organizations.find((org) => {
            return org.id === github.currentOrganizationId;
        });
        const project = github.projects.find((proj) => {
            return proj.id === github.currentProjectId;
        });

        const data = {
            lists: trello.lists.filter((list) => list.checked).map((list) => {
                return {
                    name: list.name,
                    id: list.id,
                    destinationName: trello.destinationListNames[list.destinationListNameIndex]
                };
            }),
            organizationName: organization.login,
            project: {
                id: project.id,
                name: project.name,
                'html_url': project.html_url
            },
            boardId: trello.currentBoardId
        };

        dispatch(performMigration(data)).then((action) => {
            window.location.href = action.resolved.html_url;
            return;
        }).catch((err) => {
            console.log(err);
        });
    }

    handleCardConverterToggle = () => {
        this.setState({
            showCardConverter: !this.state.showCardConverter
        });
    }

    ////////////////////
    // Helper methods //
    ////////////////////

    getPromptValue(promptDisplay, existMessage, existingValues = []) {
        const name = prompt(promptDisplay);

        // Canceled prompt
        if (name === null) {
            return name;
        }

        const trimmed = name.trim();
        const alreadyExists = existingValues.some((value) => {
            return value.toLowerCase() === trimmed.toLowerCase();
        });

        if (alreadyExists) {
            alert(existMessage);

            return this.getPromptValue(promptDisplay, existMessage, existingValues);
        }

        if (trimmed) {
            return name.trim();
        }

        return this.getPromptValue(promptDisplay, existMessage, existingValues);
    }

    renderTrelloBoardSection() {
        const { trello } = this.props;
        const trelloSelectProps = {
            name: 'board',
            value: trello.currentBoardId,
            onChange: this.handleSelectChange,
            disabled: trello.isBoardsLoading,
            options: trello.boards.map(({ name, id }) => {
                return { text: name, value: id };
            })
        };
        const currentBoardName = (trello.boards.find((board) => {
            return board.id === trello.currentBoardId;
        }) || {}).name;

        if (trello.isBoardsLoading) {
            trelloSelectProps.options = [{ text: 'Loading…', value: '' }];
        }

        return (
            <section className="main-section">
                <div className="u-left-right">
                    <h4>Choose a Trello board</h4>
                    <button onClick={this.handleCardConverterToggle}>trello-card-to-github-issue converter for {currentBoardName}</button>
                </div>
                <Select {...trelloSelectProps} />
            </section>
        );
    }

    renderTrelloBoardLists() {
        const { trello } = this.props;

        if (!trello.currentBoardId) {
            return null;
        }

        let content;

        if (trello.isListsLoading) {
            content = (
                <Loader
                    text="Loading lists"
                />
            );
        }
        else if (trello.hasListError) {
            content = (
                <p>There was an error loading lists for the selected board.</p>
            );
        }
        else {
            const checkboxes = trello.lists.map((list, i) => {
                const checkbox = (
                    <label key={i} className="u-block">
                        <input
                            type="checkbox"
                            value={list.id}
                            name="list"
                            onChange={this.handleCheckboxChange}
                            checked={list.checked}
                        />
                        {list.name}
                    </label>
                );

                if (this.state.keepColumnNames) {
                    return checkbox;
                }

                const selectProps = {
                    name: 'destinationList',
                    value: trello.destinationListNames[list.destinationListNameIndex],
                    onChange: this.handleSelectChange,
                    options: trello.destinationListNames.map((name) => {
                        return { text: name, value: name };
                    }),
                    selectProps: {
                        'data-index': i
                    }
                };

                selectProps.options.unshift({ text: '+ Add new list name', value: 'add' });

                return (
                    <div className="u-left-right list-row" key={i}>
                        {checkbox}
                        <Select {...selectProps} />
                    </div>
                );
            });

            content = checkboxes;

            if (!this.state.keepColumnNames) {
                content = (
                    <div className="u-zebra">
                        {checkboxes}
                    </div>
                );
            }
        }

        let tableHeader;

        if (!this.state.keepColumnNames) {
            tableHeader = (
                <div className="table-header u-left-right">
                    <p>Trello column</p>
                    <p>GitHub column</p>
                </div>
            );
        }

        return (
            <section className="main-section">
                <div className="u-left-right">
                    <h4 style={{ marginTop: 0 }}>Select lists to migrate</h4>
                    <label>
                        <input
                            type="checkbox"
                            checked={this.state.keepColumnNames}
                            onChange={this.handleColumnNameCheck}
                        />
                        1:1 migration
                    </label>
                </div>
                {tableHeader}
                {content}
            </section>
        );
    }

    renderGithubDestination() {
        const { github } = this.props;
        const selectProps = {
            name: 'organization',
            value: github.currentOrganizationId.toString(),
            onChange: this.handleSelectChange,
            disabled: github.isOrganizationLoading,
            options: github.organizations.map(({ login, id }) => {
                return { text: login, value: id };
            })
        };

        if (github.isOrganizationLoading) {
            selectProps.options = [{ text: 'Loading…', value: '' }];
        }

        return (
            <section className="main-section">
                <h4>Choose a GitHub organization</h4>
                <Select {...selectProps} />
            </section>
        );
    }

    renderGithubProjects() {
        const { github } = this.props;
        const selectProps = {
            name: 'project',
            value: github.currentProjectId.toString(),
            onChange: this.handleSelectChange,
            disabled: github.isProjectsLoading,
            selectProps: {
                required: true
            },
            options: github.projects.map(({ name, body, id }) => {
                let text = name;

                if (body) {
                    text = `${text} - ${body}`;
                }

                if (id === 'new') {
                    text = `${text} - (Will be created upon migration)`;
                }

                return { text, value: id };
            })
        };

        selectProps.options.unshift({ text: 'Create new project…', value: 'add' });
        selectProps.options.unshift({ text: '', value: '' });

        if (github.isProjectsLoading) {
            selectProps.options = [{ text: 'Loading…', value: '' }];
        }

        return (
            <section className="main-section">
                <h4>Choose an organization project</h4>
                <Select {...selectProps} />
            </section>
        );
    }

    renderContent() {
        const { github } = this.props;
        let submitText = 'Migrate';

        if (github.isMigrating) {
            submitText = 'Migrating…';
        }

        if (this.state.showCardConverter) {
            return (
                <CardConverterContainer
                    onExitClick={this.handleCardConverterToggle}
                />
            );
        }

        return (
            <Fragment>
                {this.renderTrelloBoardSection()}
                {this.renderTrelloBoardLists()}
                {this.renderGithubDestination()}
                {this.renderGithubProjects()}

                <div className="u-text-center">
                    <input
                        type="submit"
                        className="button"
                        value={submitText}
                        disabled={github.isMigrating}
                    />
                </div>
            </Fragment>
        );
    }

    render() {
        return (
            <form className="page-content" onSubmit={this.handleMigrationFormSubmit}>
                {this.renderContent()}
            </form>
        );
    }
}

function mapStateToProps(state) {
    return {
        github: state.github,
        trello: state.trello
    };
}

export default connect(mapStateToProps)(MainContainer);
