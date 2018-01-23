import React, { Component } from 'react';
import PropTypes from 'prop-types';

const TEXT_LIMIT = 200;

export default class CardListing extends Component {
    static propTypes = {
        card: PropTypes.object,
        onCardActionClick: PropTypes.func
    }

    constructor(props) {
        super(props);

        this.state = {
            expanded: false
        };
    }

    ////////////////////
    // Event handlers //
    ////////////////////

    handleExpandClick = () => {
        this.setState((prevState) => {
            return {
                ...prevState,
                expanded: !prevState.expanded
            };
        });
    }

    handleTextClick = (e) => {
        e.currentTarget.select();
        e.currentTarget.focus();
    }

    ////////////////////
    // helper methods //
    ////////////////////

    renderText(text) {
        if (text && text.length > TEXT_LIMIT && !this.state.expanded) {
            return `${text.substr(0, TEXT_LIMIT)}…`;
        }

        return text;
    }

    renderMarkdownTextarea(markdown) {
        if (!markdown) {
            return null;
        }

        return (
            <textarea value={markdown} readOnly onClick={this.handleTextClick} ref={(t) => {
                if (t) {
                    t.select();
                    t.focus();
                }
            }}
            />
        );
    }

    renderIssueLink(issue) {
        if (!issue) {
            return null;
        }

        return (
            <p><a href={issue.url}>{issue.url}</a></p>
        );
    }

    render() {
        const { card } = this.props;

        let showMoreButton;

        if (card.desc && card.desc.length > TEXT_LIMIT) {
            let showMoreText = 'Expand';

            if (this.state.expanded) {
                showMoreText = 'Collapse';
            }

            showMoreButton = (
                <button type="button" onClick={this.handleExpandClick} className="card-listing__expand">{showMoreText}</button>
            );
        }

        const getIssueMarkdownButton = (
            <button
                type="button"
                onClick={this.props.onCardActionClick}
                data-action="markdown"
                data-id={card.id}
                disabled={card.isMarkdownLoading || !!card.markdown}
            >Get markdown body</button>
        );

        const createIssueButton = (
            <button
                type="button"
                onClick={this.props.onCardActionClick}
                data-action="createIssue"
                data-id={card.id}
                disabled={card.isCreatingIssue || !!card.issue}
            >Create issue</button>
        );

        return (
            <li className="card-listing">
                <h4>{card.name}</h4>
                <p className="card-listing__desc">{this.renderText(card.desc)}</p>
                {this.renderMarkdownTextarea(card.markdown)}
                {this.renderIssueLink(card.issue)}
                {getIssueMarkdownButton}
                {createIssueButton}
                {showMoreButton}
            </li>
        );
    }
}
