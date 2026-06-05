import Dashboard from '../../components/Dashboard';

export default function ManagementHome({ member, ...props }) {
  return <Dashboard {...props} hideBudget={true} member={member} />;
}
