import * as React from 'react';
import { render } from 'react-dom';
import {
  FormLabel,
  Button,
  Dropdown,
  DropdownList,
  DropdownListItem
} from '@contentful/forma-36-react-components';
import { init, FieldExtensionSDK } from 'contentful-ui-extensions-sdk';
import { format } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';
import '@contentful/forma-36-react-components/dist/styles.css';
import './index.css';

interface AppProps {
  sdk: FieldExtensionSDK;
}

interface AppState {
  value?: any;
  dateTime: any;
  timeZone: any;
  isOpen: boolean;
}

const LOCAL_STORAGE_TIMZONE_KEY = 'date-with-timezones-default';

const DEFAULT_TIMEZONE = 'PDT (UTC-07:00)';
const DATE_FORMAT = 'yyyy-MM-ddThh:mm';

const TIMEZONES: { [key: string]: string } = {
  'UTC-12:00': '-12:00',
  'UTC-11:00': '-11:00',
  'UTC-10:00': '-10:00',
  'UTC-09:30': '-09:30',
  'UTC-09:00': '-09:00',
  'PST (UTC-08:00)': '-07:00',
  'PDT (UTC-07:00)': '-07:00',
  'MST (UTC-07:00)': '-07:00',
  'MDT (UTC-06:00)': '-06:00',
  'CST (UTC-06:00)': '-06:00',
  'CDT (UTC-05:00)': '-05:00',
  'EST (UTC-05:00)': '-04:00',
  'UTC-04:30': '-04:30',
  'EDT (UTC-04:00)': '-04:00',
  'UTC-03:30': '-03:30',
  'BRT (UTC-03:00)': '-03:00',
  'UTC-02:00': '-02:00',
  'UTC-01:00': '-01:00',
  UTC: '+00:00',
  'CET (UTC+01:00)': '+01:00',
  'CEST (UTC+02:00)': '+02:00',
  'TRT (UTC+03:00)': '+03:00',
  'UTC+03:30': '+03:30',
  'UTC+04:00': '+04:00',
  'UTC+04:30': '+04:30',
  'UTC+05:00': '+05:00',
  'IST (UTC+05:30)': '+05:30',
  'UTC+05:45': '+05:45',
  'UTC+06:00': '+06:00',
  'UTC+06:30': '+06:30',
  'UTC+07:00': '+07:00',
  'SGT (UTC+08:00)': '+08:00',
  'UTC+08:45': '+08:45',
  'JST (UTC+09:00)': '+09:00',
  'UTC+09:30': '+09:30',
  'AEST (UTC+10:00)': '+10:00',
  'UTC+10:30': '+10:30',
  'AEDT (UTC+11:00)': '+11:00',
  'UTC+11:30': '+11:30',
  'NZST (UTC+12:00)': '+12:00',
  'UTC+12:45': '+12:45',
  'NZDT (UTC+13:00)': '+13:00',
  'UTC+14:00': '+14:00'
};

export class App extends React.Component<AppProps, AppState> {
  detachExternalChangeHandler: Function | null = null;

  constructor(props: AppProps) {
    super(props);

    const initDate = new Date() || props.sdk.field.getValue();
    const initTimezone = window.localStorage.getItem(LOCAL_STORAGE_TIMZONE_KEY) || DEFAULT_TIMEZONE;
    const zoned = utcToZonedTime(initDate, TIMEZONES[initTimezone]);
    const dateTime = format(zoned, DATE_FORMAT);

    this.state = {
      dateTime,
      timeZone: initTimezone,
      isOpen: false
    };
  }

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

  onExternalChange = (value: string) => this.setState({ value });

  onClose = () => this.setState({ isOpen: false });

  handleToggle = () => this.setState({ isOpen: !this.state.isOpen });

  handleTimezone = (timeZone: string) => {
    window.localStorage.setItem(LOCAL_STORAGE_TIMZONE_KEY, timeZone);
    this.setState({ isOpen: false, timeZone });
  };

  handleDateTime = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value;
    const timeZone = TIMEZONES[this.state.timeZone];
    const utc = zonedTimeToUtc(value, timeZone);
    this.setState({ dateTime: value });

    if (utc) {
      await this.props.sdk.field.setValue(utc.toISOString());
    } else {
      await this.props.sdk.field.removeValue();
    }
  };

  render() {
    const { isOpen, timeZone, dateTime } = this.state;

    return (
      <div className="date-with-timezones">
        <div className="row">
          <div className="label">
            <FormLabel htmlFor="timezone">Timezone</FormLabel>
          </div>
          <Dropdown
            isOpen={isOpen}
            onClose={this.onClose}
            key={Date.now()} // Force Reinit
            position="bottom-left"
            toggleElement={
              <Button size="small" buttonType="muted" indicateDropdown onClick={this.handleToggle}>
                {timeZone}
              </Button>
            }>
            <DropdownList maxHeight={110}>
              {Object.keys(TIMEZONES).map(timeZone => (
                <DropdownListItem key={timeZone} onClick={() => this.handleTimezone(timeZone)}>
                  {timeZone}
                </DropdownListItem>
              ))}
            </DropdownList>
          </Dropdown>
        </div>

        <div className="row">
          <div className="input-field">
            <div className="label">
              <FormLabel htmlFor="date">Date</FormLabel>
            </div>
            <input
              type="datetime-local"
              id="date"
              name="date"
              value={dateTime}
              onChange={this.handleDateTime}
            />
          </div>
        </div>
      </div>
    );
  }
}

init(sdk => {
  render(<App sdk={sdk as FieldExtensionSDK} />, document.getElementById('root'));
});
