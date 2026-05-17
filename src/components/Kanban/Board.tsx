import { useEffect, useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { supabase, type Task, type Column } from '@/lib/supabase'
import { ColumnContainer } from './ColumnContainer'
import { TaskCard } from './TaskCard'

const BOARD_ID = '00000000-0000-0000-0000-000000000000'

export function Board() {
  const [openColumnId, setOpenColumnId] = useState<string | null>(null)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const queryClient = useQueryClient()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  // Query para obtener las columnas
  const { data: columns = [] } = useQuery({
    queryKey: ['columns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('columns')
        .select('*')
        .eq('board_id', BOARD_ID)
        .order('position', { ascending: true })
      if (error) throw error
      return data as Column[]
    },
    staleTime: 0, // Siempre datos frescos
  })

  const columnIds = useMemo(() => columns.map(c => c.id), [columns])

  // Query para obtener las tareas
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      if (columnIds.length === 0) return []
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .in('column_id', columnIds)
        .order('position', { ascending: true })
      if (error) throw error
      return data as Task[]
    },
    enabled: columnIds.length > 0,
    staleTime: 0, // Siempre datos frescos
  })

  // Mutación para actualizar tarea (drag & drop)
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, column_id, position }: { id: string; column_id: string; position: number }) => {
      const { error } = await supabase
        .from('tasks')
        .update({ column_id, position })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      // Recargar datos después de mover
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  // Ctrl+Z simple: recargar datos desde Supabase
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // No hacer nada si el usuario está escribiendo en un input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Ctrl+Z o Cmd+Z
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault()
        // Recargar datos desde Supabase
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
        queryClient.invalidateQueries({ queryKey: ['columns'] })
        console.log('🔄 Deshaciendo último cambio... Recargando desde servidor')
      }
    },
    [queryClient]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'Task') {
      setActiveTask(event.active.data.current.task)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeTaskData = tasks.find(t => t.id === active.id)
    if (!activeTaskData) return

    const overTask = over.data.current?.type === 'Task' ? (over.data.current.task as Task) : null
    let newColumnId = activeTaskData.column_id
    let newPosition = activeTaskData.position

    if (overTask) {
      newColumnId = overTask.column_id
      newPosition = overTask.position - 1
    } else if (over.data.current?.type === 'Column') {
      newColumnId = over.id as string
      const columnTasks = tasks.filter(t => t.column_id === newColumnId)
      newPosition = columnTasks.length > 0 ? Math.max(...columnTasks.map(t => t.position)) + 1000 : 1000
    }

    updateTaskMutation.mutate({
      id: activeTaskData.id,
      column_id: newColumnId,
      position: newPosition,
    })
  }

  return (
    <div className="p-4 h-full min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto h-full">
          <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
            {columns.map(column => (
              <ColumnContainer
                key={column.id}
                column={column}
                tasks={tasks.filter(t => t.column_id === column.id)}
                isCreating={openColumnId === column.id}
                onOpenChange={open => setOpenColumnId(open ? column.id : null)}
              />
            ))}
          </SortableContext>
        </div>
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}