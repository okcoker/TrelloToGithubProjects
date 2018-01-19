import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

export default class Select extends Component {
    static propTypes = {
        name: PropTypes.string.isRequired,
        options: PropTypes.array.isRequired,
        defaultValue: PropTypes.string,
        value: PropTypes.string,
        className: PropTypes.string,
        selectProps: PropTypes.object,
        onChange: PropTypes.func,
        containerProps: PropTypes.object
    }

    static defaultProps = {
        selectProps: {}
    }

    renderOptions(options = []) {
        return options.map((option, i) => {
            return (
                <option key={i} value={option.value}>{option.text}</option>
            );
        });
    }

    render() {
        const { options, name, value, defaultValue, selectProps, onChange, containerProps, className } = this.props;
        const klass = classnames('select', {
            [className]: className
        });

        return (
            <div className={klass} {...containerProps}>
                <select
                    name={name}
                    onChange={onChange}
                    defaultValue={defaultValue}
                    value={value}
                    {...selectProps}
                >
                    {this.renderOptions(options)}
                </select>
                <svg
                    className="select__arrow"
                    version="1.1"
                    width="18px"
                    height="18px"
                    viewBox="0 0 18 18"
                ><path d="M17.893,6.087l-3.13-3.13L8.946,8.774L3.129,2.958L0,6.087l8.946,8.956L17.893,6.087z"/></svg>
            </div>
        );
    }
}
