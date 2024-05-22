import { render } from 'preact';
import './style.css';

export function App() {
    return <div class={'bg-red-600'}></div>;
}

render(<App />, document.getElementById('app'));
