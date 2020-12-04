import * as React from 'react';
import { render } from 'react-dom';
import {
  FormLabel,
  TextInput,
  Button,
  Dropdown,
  DropdownList,
  DropdownListItem
} from '@contentful/forma-36-react-components';
import { init, FieldExtensionSDK } from 'contentful-ui-extensions-sdk';
import { format, getUnixTime } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';
import '@contentful/forma-36-react-components/dist/styles.css';
import './index.css';

interface AppProps {
  sdk: FieldExtensionSDK;
}

interface AppState {
  value?: string;
}

const DEFAULT_TIMEZONE = 'date-with-timezones-default';

export class App extends React.Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props);
    const value = props.sdk.field.getValue() || new Date();
    const defaultZone = window.localStorage.getItem(DEFAULT_TIMEZONE) || 'New York';
    const zoned = utcToZonedTime(value, this.timezones[defaultZone]);

    this.state = {
      date: format(zoned, 'yyyy-MM-dd'),
      time: format(zoned, 'HH:mm'),
      timeZone: defaultZone,
      isOpen: false
    };
  }

  detachExternalChangeHandler: Function | null = null;

  componentDidMount() {
    this.props.sdk.window.startAutoResizer();

    // Handler for external field value changes (e.g. when multiple authors are working on the same entry).
    this.detachExternalChangeHandler = this.props.sdk.field.onValueChanged(this.onExternalChange);
  }

  componentWillUnmount() {
    if (this.detachExternalChangeHandler) {
      this.detachExternalChangeHandler();
    }
  }

  timezones = {
    "New York": "America/New_York",
    "Los Angeles": "America/Los_Angeles",
    "London": "Europe/London",
    "Shanghai": "Asia/Shanghai",
    "New Delhi": "Asia/Calcutta"
  };

  onExternalChange = (value: string) => {
    this.setState({ value });
  };

  onChange = async (field: string, value: string) => {
    const state = this.state;
    state[field] = value;
    this.setState(state);

    const longTimeZone = this.timezones[state.timeZone];
    const newValue = zonedTimeToUtc(`${state.date} ${state.time}`, longTimeZone);
    if (newValue) {
      await this.props.sdk.field.setValue(newValue);
    } else {
      await this.props.sdk.field.removeValue();
    }
  }

  onChangeDate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value;
    this.onChange("date", value);
  };

  onChangeTime = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value;
    console.log(value);
    const parts = value.split(':');
    let part1 = parseInt(parts[0].replace(/\D/g, ''), 10);
    if (parts.length > 1) {
      let part2 = parseInt(parts[1].replace(/\D/g, ''), 10);
      if (part1 > 23) part1 = 23;
      if (part2 > 59) part2 = 59;
      if (part1 < 10) part1 = `0${part1}`;
      if (part2 < 10) part2 = `0${part2}`;
      this.onChange("time", `${part1}:${part2}`);
    } else {
      if (part1 > 59) part1 = 59;
      if (part1 < 10) part1 = `0${part1}`;
      this.onChange("time", `00:${part1}`);
    }
  };

  onClose = () => {
    this.setState({ isOpen: false });
  }

  onToggleButton = () => {
    const { isOpen } = this.state;
    this.setState({ isOpen: !isOpen });
  }

  setTimezone = (timezone: string) => {
    this.onChange("timeZone", timezone);
    window.localStorage.setItem(DEFAULT_TIMEZONE, timezone);
    this.setState({ isOpen: false });
  }

  render() {
    const { isOpen, timeZone, date, time, value, timeZoneChanged } = this.state;
    const listItems = [];
    Object.keys(this.timezones).forEach(key => {
      listItems.push(
        <DropdownListItem key={key} onClick={() => {this.setTimezone(key)}}>
          {key}
        </DropdownListItem>
      )
    });

    return (
      <div className="date-with-timezones">
        <div className="row">
          <div className="label">
            <FormLabel htmlFor="timezone">TimeZone</FormLabel>
          </div>
          <Dropdown
            name="timezone"
            isOpen={isOpen}
            onClose={this.onClose}
            key={Date.now()} // Force Reinit
            position="bottom-left"
            toggleElement={
              <Button
                size="small"
                buttonType="muted"
                indicateDropdown
                onClick={this.onToggleButton}
              >
                {timeZone}
              </Button>
            }
          >
            <DropdownList maxHeight={110}>
              {listItems}
            </DropdownList>
          </Dropdown>
        </div>

        <div className="row">
          <div className="input-field">
            <div className="label">
              <FormLabel htmlFor="timezone">Date</FormLabel>
            </div>
            <TextInput
              width="medium"
              type="date"
              id="date-field"
              testId="date-field"
              value={date}
              onChange={this.onChangeDate}
            />
          </div>
          <div className="input-field">
            <div className="label">
              <FormLabel htmlFor="timezone">Time</FormLabel>
            </div>
            <TextInput
              width="medium"
              type="text"
              id="time-field"
              testId="time-field"
              value={time}
              onBlur={this.onChangeTime}
            />
          </div>
        </div>
      </div>
    );
  };
}

init(sdk => {
  render(<App sdk={sdk as FieldExtensionSDK} />, document.getElementById('root'));
});
