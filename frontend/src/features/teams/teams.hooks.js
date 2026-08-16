import { useAsync } from '../../hooks/useAsync'
import { teamsService } from '../../services/teams.service'

export function useTeams() {
  return useAsync(() => teamsService.list(), [])
}

export function useTeam(id) {
  return useAsync(() => teamsService.get(id), [id])
}
