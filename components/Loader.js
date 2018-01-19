import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

export default class Loader extends Component {
    static propTypes = {
        className: PropTypes.string,
        text: PropTypes.string,
        size: PropTypes.number
    }

    static defaultProps = {
        size: 50
    }

    render() {
        const { className, size, text } = this.props;
        const klass = classnames('loader-container', {
            [className]: className
        });

        const style = {};

        if (size) {
            style.width = `${size}px`;
            style.height = `${size}px`;
        }

        let message;

        if (text) {
            message = (
                <p>{text}</p>
            );
        }

        return (
            <div className={klass}>
                <div className="loader" style={style}>
                    <span className="column" />
                    <span className="column" />
                </div>
                {message}
            </div>
        );
    }
}
