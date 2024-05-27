import { render } from 'preact';
import { signal } from '@preact/signals';
import { App } from './App';

import './style.css';

render(<App />, document.getElementById('app') ?? document.createElement('div'));
