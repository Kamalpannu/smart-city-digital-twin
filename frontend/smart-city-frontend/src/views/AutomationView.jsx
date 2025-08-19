import AutomationRules from '../components/AutomationRules';

const AutomationView = ({ rules, onCreateRule, onUpdateRule, onDeleteRule }) => {
  return (
    <AutomationRules
      rules={rules}
      onCreateRule={onCreateRule}
      onUpdateRule={onUpdateRule}
      onDeleteRule={onDeleteRule}
    />
  );
};

export default AutomationView;
