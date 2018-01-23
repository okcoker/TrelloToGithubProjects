import React, { Component } from 'react';
import PropTypes from 'prop-types';
import withRedux from 'next-redux-wrapper';
import classnames from 'classnames';
import Cookie from 'js-cookie';

import { configureStore } from '../redux/store';

import { setPersonalToken, validateCredentials as validateGithubCredentials } from '../redux/ducks/github';
import { setKey, setSecret, validateCredentials as validateTrelloCredentials } from '../redux/ducks/trello';
import Auth from '../components/Auth';
import ForkMe from '../components/ForkMe';
import MainContainer from '../components/MainContainer';

class Index extends Component {
    static propTypes = {
        dispatch: PropTypes.func,
        github: PropTypes.object,
        trello: PropTypes.object
    }

    constructor(props) {
        super(props);

        this.state = {
            loading: true
        };
    }

    componentDidMount() {
        this.checkStorage();
    }

    ////////////////////
    // Event handlers //
    ////////////////////

    handleAuthFormSubmit = (e) => {
        e.preventDefault();
        const { dispatch } = this.props;
        const form = e.currentTarget;
        const githubToken = form.githubToken.value;
        const trelloKey = form.trelloKey.value;
        const trelloSecret = form.trelloSecret.value;

        const cookieKeys = {
            trelloKey,
            trelloSecret,
            githubToken
        };

        Promise.all([
            dispatch(validateGithubCredentials(githubToken)),
            dispatch(validateTrelloCredentials(trelloKey, trelloSecret))
        ]).then(() => {
            this.setStorageKeys(cookieKeys);

            dispatch(setPersonalToken(githubToken));
            dispatch(setKey(trelloKey));
            dispatch(setSecret(trelloSecret));
            return;
        }).catch((err) => {
            console.error(err);
        });
    }

    ////////////////////
    // Helper methods //
    ////////////////////

    getStorageKeys() {
        let githubToken;
        let trelloKey;
        let trelloSecret;

        try {
            githubToken = Cookie.get('githubToken') || window.localStorage.getItem('githubToken');
            trelloKey = Cookie.get('trelloKey') || window.localStorage.getItem('trelloKey');
            trelloSecret = Cookie.get('trelloSecret') || window.localStorage.getItem('trelloSecret');
        }
        catch (err) {} // eslint-disable-line

        return { githubToken, trelloKey, trelloSecret };
    }

    setStorageKeys(cookieKeys = {}) {
        Object.keys(cookieKeys).forEach((key) => {
            Cookie.set(key, cookieKeys[key], {
                path: '/',
                secure: process.env.NODE_ENV === 'production'
            });
        });

        try {
            Object.keys(cookieKeys).forEach((key) => {
                window.localStorage.setItem(key, cookieKeys[key]);
            });
        }
        catch (err) {} // eslint-disable-line
    }

    checkStorage() {
        const { dispatch } = this.props;

        try {
            const { githubToken, trelloKey, trelloSecret } = this.getStorageKeys();

            if (!githubToken || !trelloKey || !trelloSecret) {
                throw new Error('Didnt find all creds');
            }

            dispatch(setPersonalToken(githubToken));
            dispatch(setKey(trelloKey));
            dispatch(setSecret(trelloSecret));
        }
        catch (err) {} // eslint-disable-line

        this.setState({
            loading: false
        });
    }

    renderContent(github, trello, loading) {
        const authClass = classnames('auth-container', {
            'auth-container--loading': loading
        });
        const hasValidCredentials = github.hasValidCredentials && trello.hasValidCredentials;
        const isValidating = github.isValidatingCredentials || trello.isValidatingCredentials;

        if (hasValidCredentials) {
            return <MainContainer />;
        }

        return (
            <div className={authClass}>
                <Auth
                    loading={loading}
                    isValidating={isValidating}
                    githubValidationError={github.hasValidationError}
                    trelloValidationError={trello.hasValidationError}
                    githubToken={github.token}
                    trelloKey={trello.key}
                    trelloSecret={trello.secret}
                    onFormSubmit={this.handleAuthFormSubmit}
                />
            </div>
        );
    }

    render() {
        const { github, trello } = this.props;
        const { loading } = this.state;

        return (
            <div>
                <ForkMe />
                <div className="logo-container">
                    <img src="/static/favicon.png" alt="" />
                    <p>Trello to Projects</p>
                </div>
                {this.renderContent(github, trello, loading)}
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

export default withRedux(configureStore, mapStateToProps)(Index);
