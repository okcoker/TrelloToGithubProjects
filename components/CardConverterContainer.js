import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { getCards, getMarkdownForCard } from '../redux/ducks/trello';
import { setRepoId, getRepos, setProjectId, createIssueFromCardId } from '../redux/ducks/github';

import Select from './Select';
import Loader from './Loader';
import CardListing from './CardListing';

class CardConverterContainer extends Component {
    static propTypes = {
        dispatch: PropTypes.func,
        onExitClick: PropTypes.func,
        github: PropTypes.object,
        trello: PropTypes.object
    }

    constructor(props) {
        super(props);

        this.state = {
            confirmedOneIssue: false
        };
    }

    componentDidMount() {
        const { dispatch, trello } = this.props;

        dispatch(getCards(trello.currentBoardId));
        dispatch(getRepos(trello.currentBoardId));
    }

    ////////////////////
    // Event handlers //
    ////////////////////

    handleSelectChange = (e) => {
        const { dispatch } = this.props;
        const select = e.currentTarget;
        const name = select.name;
        const value = select.options[select.selectedIndex].value;

        switch (name) {
            case 'repo': {
                dispatch(setRepoId(value));
                break;
            }

            case 'project': {
                dispatch(setProjectId(value));
                break;
            }

            default:
                break;
        }
    }

    handleCardActionClick = (e) => {
        const { dispatch, github } = this.props;
        const button = e.currentTarget;
        const action = button.getAttribute('data-action');
        const cardId = button.getAttribute('data-id');

        switch (action) {
            case 'markdown':
                dispatch(getMarkdownForCard(cardId));
                break;

            case 'createIssue': {
                const repo = github.repos.find((r) => r.id === github.currentRepoId);

                if (!this.state.confirmedOneIssue) {
                    if (!confirm(`Are you sure you want to crete an issue in the repo: ${repo.full_name}`)) {
                        return;
                    }
                }

                this.setState({
                    confirmedOneIssue: true
                });

                dispatch(createIssueFromCardId(cardId, repo.owner.login, repo.name));
                break;
            }

            default:
                break;
        }
    }

    ////////////////////
    // Helper methods //
    ////////////////////

    render() {
        const { trello, github } = this.props;
        const repoSelectProps = {
            name: 'repo',
            value: github.currentRepoId.toString(),
            onChange: this.handleSelectChange,
            disabled: github.isReposLoading,
            selectProps: {
                required: true
            },
            options: github.repos.map(({ full_name: name, id }) => {
                return { text: name, value: id };
            })
        };
        const projectSelectProps = {
            name: 'project',
            value: github.currentProjectId.toString(),
            onChange: this.handleSelectChange,
            disabled: github.isProjectsLoading,
            options: github.projects.map(({ name, id }) => {
                return { text: name, value: id };
            })
        };

        projectSelectProps.options.unshift({ text: '', value: '' });

        const list = trello.cards.map((card, i) => {
            return (
                <CardListing
                    key={i}
                    card={card}
                    onCardActionClick={this.handleCardActionClick}
                />
            );
        });

        let cardLoader;

        if (trello.isCardsLoading) {
            cardLoader = (
                <Loader text="Loading cards…" />
            );
        }

        return (
            <div className="page-content">
                <button onClick={this.props.onExitClick} type="button">Back to project migration</button>
                <section className="main-section">
                    <h4>Choose a repository</h4>
                    <Select {...repoSelectProps} />
                </section>
                {/* <section className="main-section">
                    <h4>Choose a project (optional)</h4>
                    <Select {...projectSelectProps} />
                </section>*/}
                <hr />
                <ul>
                    {cardLoader}
                    {list}
                </ul>
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        github: state.github,
        trello: state.trello
    };
}

export default connect(mapStateToProps)(CardConverterContainer);
