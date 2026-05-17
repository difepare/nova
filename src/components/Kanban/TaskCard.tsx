import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from '@/components/ui/card'
import { GripVertical } from 'lucide-react'
import { type Task } from '@/lib/supabase'

interface Props {
  task: Task
  isOverlay?: boolean
  onClick?: () => void
  onDoubleClick?: () => void
}

export function TaskCard({ task, isOverlay, onClick, onDoubleClick }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: 'Task', task }
  })

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
    opacity: isDragging? 0.5 : 1,
  }

  // Si es overlay no debe tener eventos
  if (isOverlay) {
    return (
      <Card className="p-3 bg-zinc-800/50 border-zinc-700 cursor-grabbing">
        <p className="text-sm text-zinc-100">{task.title}</p>
      </Card>
    )
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card 
        className="p-3 bg-zinc-800/50 border-zinc-700 hover:border-zinc-600 cursor-pointer group"
        onClick={onClick}
        onDoubleClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onDoubleClick?.()
        }}
      >
        <div className="flex items-start gap-2">
          <button 
            {...attributes} 
            {...listeners} 
            className="cursor-grab touch-none mt-0.5 opacity-0 group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()} // Evita que abra modal al arrastrar
            onDoubleClick={(e) => e.stopPropagation()} // Evita que borre al arrastrar
          >
            <GripVertical className="h-3 w-3 text-zinc-500" />
          </button>
          <p className="text-sm text-zinc-100 flex-1 select-none">{task.title}</p>
        </div>
        {task.description && (
          <p className="text-xs text-zinc-400 mt-2 line-clamp-2">{task.description}</p>
        )}
      </Card>
    </div>
  )
}