import { Empty, useDocTitle } from './shared';

export default function ComingSoon({ name }) {
  useDocTitle(name);
  return (
    <div className="page narrow">
      <Empty icon="🚧" title={`${name} is coming soon.`}>
        This section is not built yet. Use the tabs at the top to go back to FDE.
      </Empty>
    </div>
  );
}
