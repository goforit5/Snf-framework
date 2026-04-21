import { useParams } from 'react-router-dom';
import ShellV2 from './ShellV2';

export default function ShellView({ role, theme }) {
  const { domainKey, recordId } = useParams();

  // Map route params to ShellV2 props
  const initialDomain = domainKey || 'home';

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ShellV2
        role={role}
        theme={theme}
        width="100%"
        height="100%"
        initialDomain={initialDomain}
      />
    </div>
  );
}
