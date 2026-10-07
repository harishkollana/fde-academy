import { Link } from 'react-router-dom';
import { Empty, useDocTitle } from './shared';

export default function NotFound({ what = 'page' }) {
  useDocTitle('Not found');
  return (
    <div className="page narrow">
      <Empty icon="🧭" title={`We could not find that ${what}.`}>
        The link may be old, or this part of the course is still being written. Go back to the <Link to="/">dashboard</Link> or use
        the search (Ctrl K) to find it.
      </Empty>
    </div>
  );
}
