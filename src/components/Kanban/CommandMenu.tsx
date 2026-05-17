import { useEffect } from 'react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog' // ← Agrega
import { useQuery } from '@tanstack/react-query'
import { supabase, type Task } from '@/lib/supabase'
import { FileText } from 'lucide-react'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectTask: (task: Task) => void
}

export function CommandMenu({ open, onOpenChange, onSelectTask }: Props) {
  const { data: allTasks = [] } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50) // ← Agregué limit para no traer miles
      if (error) throw error
      return data as Task[]
    },
    enabled: open,
    staleTime: 1000 * 30 // ← Cache 30s para no spamear Supabase
  })

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, onOpenChange])

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle className="sr-only">Buscar tareas</DialogTitle>
        <DialogDescription className="sr-only">
          Busca y navega a cualquier tarea del tablero
        </DialogDescription>
      </DialogHeader>
      <CommandInput placeholder="Buscar tareas..." />
      <CommandList>
        <CommandEmpty>No se encontraron tareas.</CommandEmpty>
        <CommandGroup heading="Tareas">
          {allTasks.map((task) => (
            <CommandItem
              key={task.id}
              value={task.title} // ← Importante: cmdk filtra por value
              onSelect={() => {
                onSelectTask(task)
                onOpenChange(false)
              }}
            >
              <FileText className="mr-2 h-4 w-4" />
              <span>{task.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}