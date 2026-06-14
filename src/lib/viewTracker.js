import { supabase } from './supabase'

const viewed = new Set()

export async function recordView(projectId, userId = null) {
  if (viewed.has(projectId)) return false
  viewed.add(projectId)
  await supabase.from('project_views').insert({ project_id: projectId, user_id: userId || null })
  return true
}
