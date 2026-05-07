import { useParams, Navigate } from 'react-router-dom'
import WorkingPlan from './Workingplan'
 
// Maps URL segment → WorkingPlan planTypeKey
const PLAN_TYPE_MAP = {
  daily:        'daily',
  weekly:       'weekly',
  fortnightly:  'fortnightly',
  monthly:      'monthly',
  pjp:          'station',      // Journey Plan (PJP)
  stp:          'outstations',  // Tour Program (STP)
}
 
export default function PlanPage() {
  const { planType } = useParams()
  const key = PLAN_TYPE_MAP[planType]
 
  if (!key) return <Navigate to="/agent/plan/daily" replace />
 
  // Key prop forces full remount when plan type changes
  return <WorkingPlan key={key} planTypeKey={key} />
}