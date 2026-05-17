import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { supabase, type Task, type Column } from '@/lib/supabase'
import { TaskCard } from './TaskCard'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface Props {
  column: Column
  tasks: Task[]
  isCreating: boolean
  onOpenChange: (open: boolean) => void
  onTaskClick?: (task: Task) => void
}

export function ColumnContainer({ column, tasks, isCreating, onOpenChange, onTaskClick }: Props) {
  const [title, setTitle] = useState('')
  const queryClient = useQueryClient()

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: column.id,
    data: { type: 'Column', column },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const createTaskMutation = useMutation({
    mutationFn: async (newTitle: string) => {
      const currentTasks = queryClient.getQueryData<Task[]>(['tasks']) || []
      const columnTasks = currentTasks.filter(t => t.column_id === column.id)
      const maxPosition = columnTasks.length > 0 ? Math.max(...columnTasks.map(t => t.position)) : 0

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: newTitle,
          column_id: column.id,
          position: maxPosition + 1000,
        })
        .select()
        .single()
      if (error) throw error
      return data as Task
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    createTaskMutation.mutate(title.trim())
    setTitle('')
    onOpenChange(false)
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="w-80 shrink-0 flex flex-col bg-white/10 backdrop-blur-md border-white/20"
    >
      <div
        {...attributes}
        {...listeners}
        className="p-3 font-semibold cursor-grab active:cursor-grabbing text-white"
      >
        {column.title}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {tasks
          .sort((a, b) => a.position - b.position)
          .map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick?.(task)}
              onDoubleClick={() => deleteTaskMutation.mutate(task.id)}
            />
          ))}
      </div>

      <div className="p-2">
        {isCreating ? (
          <form onSubmit={handleCreateTask}>
            <Input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={() => {
                if (!title.trim()) onOpenChange(false)
              }}
              placeholder="Título de la tarea..."
              className="mb-2 bg-zinc-800 border-zinc-700 text-white"
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm">
                Agregar
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start text-zinc-300 hover:text-white"
            onClick={() => onOpenChange(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar tarea
          </Button>
        )}
      </div>
    </Card>
  )
}