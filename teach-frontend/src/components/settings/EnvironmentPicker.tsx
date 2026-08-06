import { memo } from 'react'
import { useEnvironment } from '../../environment/useEnvironment'
import EnvironmentCard from './EnvironmentCard'

function EnvironmentPicker() {
  const { environmentId, environments, setEnvironment } = useEnvironment()

  return (
    <div className="environment-picker" role="group" aria-label="Classroom environment">
      <div className="environment-picker-grid">
        {environments.map((environment) => (
          <EnvironmentCard
            key={environment.id}
            environment={environment}
            selected={environmentId === environment.id}
            onSelect={setEnvironment}
          />
        ))}
      </div>
    </div>
  )
}

export default memo(EnvironmentPicker)
