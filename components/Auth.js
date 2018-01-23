import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Loader from './Loader';

export default class Auth extends Component {
    static propTypes = {
        loading: PropTypes.bool,
        isValidating: PropTypes.bool,
        githubValidationError: PropTypes.bool,
        trelloValidationError: PropTypes.bool,
        onFormSubmit: PropTypes.func,
        trelloKey: PropTypes.string,
        trelloSecret: PropTypes.string,
        githubToken: PropTypes.string
    }

    renderContent() {
        const { loading, isValidating, githubValidationError, trelloValidationError } = this.props;

        if (loading) {
            return (
                <Loader
                    size={50}
                    text="Verifying credentials"
                />
            );
        }

        let buttonText = 'Continue';

        if (isValidating) {
            buttonText = 'Validating…';
        }

        let trelloError;
        let githubError;

        if (githubValidationError) {
            githubError = (
                <p className="u-text-error">There was an error validating the provided github credentials.</p>
            );
        }

        if (trelloValidationError) {
            trelloError = (
                <p className="u-text-error">There was an error validating the provided trello credentials.</p>
            );
        }


        return (
            <form onSubmit={this.props.onFormSubmit}>
                <div>
                    <h3>Trello</h3>
                    <p>You can generate these credentials <a href="https://trello.com/app-key" rel="nofollow noopener" target="_blank">here</a>.</p>
                    <label>
                        Trello Key
                        <input
                            type="text"
                            name="trelloKey"
                            defaultValue={this.props.trelloKey}
                            required
                        />
                    </label>
                    <label>
                        Trello Token
                        <input
                            type="text"
                            name="trelloSecret"
                            defaultValue={this.props.trelloSecret}
                            required
                        />
                    </label>
                    {trelloError}
                </div>
                <div>
                    <h3>GitHub</h3>
                    <p>You can generate these credentials <a href="https://github.com/settings/tokens" rel="nofollow noopener" target="_blank">here</a>. You will need this token to have "repo" and "admin:org" access.</p>
                    <label>
                        Github Personal Token
                        <input
                            type="text"
                            name="githubToken"
                            defaultValue={this.props.githubToken}
                            required
                        />
                    </label>
                    {githubError}
                </div>
                <input
                    type="submit"
                    value={buttonText}
                    disabled={isValidating}
                    className="button"
                />
            </form>
        );
    }

    render() {
        return this.renderContent();
    }
}
