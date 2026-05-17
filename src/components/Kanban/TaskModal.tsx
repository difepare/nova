import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Trash2 } from 'lucide-react'
import { supabase, type Task } from '@/lib/supabase'
import { useHistoryStore } from '@/lib/historyStore'

interface Props {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskModal({ task, open, onOpenChange }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const queryClient = useQueryClient()
  const { setTasks: setHistoryTasks } = useHistoryStore()

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
    }
  }, [task])

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, title, description }: { id: string, title: string, description: string }) => {
      const { error } = await supabase
       .from('tasks')
       .update({ title, description })
       .eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, title, description }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const prev = queryClient.getQueryData<Task[]>(['tasks'])
      const newTasks = (prev || []).map(t =>
        t.id === id? {...t, title, description } : t
      )
      queryClient.setQueryData<Task[]>(['tasks'], newTasks)
      setHistoryTasks(newTasks) // ← Clave para undo
      return { prev }
    },
    onError: (err, vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['tasks'], context.prev)
        setHistoryTasks(context.prev)
      }
    },
    onSuccess: () => {
      onOpenChange(false)
    }
  })

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const prev = queryClient.getQueryData<Task[]>(['tasks'])
      const newTasks = (prev || []).filter(t => t.id!== id)
      queryClient.setQueryData<Task[]>(['tasks'], newTasks)
      setHistoryTasks(newTasks) // ← Clave para undo
      return { prev }
    },
    onError: (err, vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['tasks'], context.prev)
        setHistoryTasks(context.prev)
      }
    },
    onSuccess: () => {
      onOpenChange(false)
    }
  })

  const handleSave = () => {
    if (!task ||!title.trim()) return
    updateTaskMutation.mutate({
      id: task.id,
      title: title.trim(),
      description: description.trim()
    })
  }

  const handleDelete = () => {
    if (!task) return
    if (confirm('¿Borrar esta tarea?')) {
      deleteTaskMutation.mutate(task.id)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSave()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-">
        <DialogHeader>
          <DialogTitle>Editar tarea</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Título de la tarea"
              className="bg-zinc-800 border-zinc-700"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Agrega una descripción..."
              className="bg-zinc-800 border-zinc-700 min-h-"
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleteTaskMutation.isPending}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Borrar
          </Button>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!title.trim() || updateTaskMutation.isPending}
            >
              Guardar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}