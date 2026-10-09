// Attach upvote / comment / view counts (and the viewer's own upvote) to a
// list of projects in a couple of queries instead of several per project.

import { supabase } from './supabase'

async function countsPerProject(ids) {
  const { data, error } = await supabase.rpc('project_stats', { ids })
  if (!error && data) {
    return Object.fromEntries(data.map(r => [r.project_id, r]))
  }

  // project_stats() not installed yet (db/migrations/012): count one by one.
  const rows = await Promise.all(ids.map(async id => {
    const [up, com, views] = await Promise.all([
      supabase.from('reactions').select('*', { count: 'exact', head: true }).eq('project_id', id),
      supabase.from('comments').select('*', { count: 'exact', head: true }).eq('project_id', id),
      supabase.from('project_views').select('*', { count: 'exact', head: true }).eq('project_id', id),
    ])
    return { project_id: id, upvotes: up.count || 0, comments: com.count || 0, views: views.count || 0 }
  }))
  return Object.fromEntries(rows.map(r => [r.project_id, r]))
}

export async function enrichProjects(projects, userId = null) {
  if (!projects?.length) return []
  const ids = projects.map(p => p.id)

  const [counts, mine] = await Promise.all([
    countsPerProject(ids),
    userId
      ? supabase.from('reactions').select('project_id').eq('user_id', userId).in('project_id', ids)
      : Promise.resolve({ data: [] }),
  ])
  const upvotedIds = new Set((mine.data || []).map(r => r.project_id))

  return projects.map(p => {
    const c = counts[p.id] || {}
    return {
      ...p,
      // Single reaction type since the upvote-only change; ProjectCard sums these.
      reaction_counts: { fire: Number(c.upvotes) || 0 },
      user_reaction: upvotedIds.has(p.id) ? 'fire' : null,
      comment_count: Number(c.comments) || 0,
      view_count: Number(c.views) || 0,
    }
  })
}
