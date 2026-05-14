import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, CalendarIcon } from 'lucide-react'
import { format, parseISO } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

import { TaskModal } from '@/components/tarefas/TaskModal'
import { INITIAL_TASKS, Task, PRIORITIES } from '@/components/tarefas/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

const MONTHS = [
  { value: '2026-04', label: 'Abril 2026' },
  { value: '2026-05', label: 'Maio 2026' },
  { value: '2026-06', label: 'Junho 2026' },
]

export default function TarefasPage() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS)
  const [selectedMonth, setSelectedMonth] = useState('2026-05')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const { toast } = useToast()

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => t.date.startsWith(selectedMonth))
  }, [tasks, selectedMonth])

  const handleOpenNew = () => {
    setEditingTask(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task)
    setIsModalOpen(true)
  }

  const handleSaveTask = (newTask: Task) => {
    if (editingTask) {
      setTasks((prev) => prev.map((t) => (t.id === newTask.id ? newTask : t)))
    } else {
      setTasks((prev) => [...prev, newTask])
    }
  }

  const confirmDelete = async () => {
    if (!taskToDelete) return
    setIsDeleting(true)
    try {
      await new Promise((r) => setTimeout(r, 600)) // mock API
      setTasks((prev) => prev.filter((t) => t.id !== taskToDelete))
      toast({ title: 'Tarefa removida com sucesso' })
      setDeleteModalOpen(false)
    } catch {
      toast({ title: 'Erro ao remover tarefa', variant: 'destructive' })
    } finally {
      setIsDeleting(false)
      setTaskToDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tarefas</h2>
          <p className="text-muted-foreground">
            Gerencie as tarefas e envie informativos para a equipe.
          </p>
        </div>
        <Button onClick={handleOpenNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">Lista de Tarefas</CardTitle>
          <div className="w-48">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Tarefa</TableHead>
                  <TableHead>Quantidade/Meta</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Nenhuma tarefa cadastrada neste mês
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                          {format(parseISO(task.date), 'dd/MM/yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>{task.responsibleName}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{task.title}</span>
                          {task.repetition !== 'Sem repetição' && (
                            <span className="text-xs text-muted-foreground">{task.repetition}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{task.quantity}</TableCell>
                      <TableCell>
                        <Badge className={PRIORITIES[task.priority]?.color} variant="outline">
                          {PRIORITIES[task.priority]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(task)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setTaskToDelete(task.id)
                              setDeleteModalOpen(true)
                            }}
                            title="Remover"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <TaskModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        taskToEdit={editingTask}
        onSaveTask={handleSaveTask}
      />

      <Dialog open={deleteModalOpen} onOpenChange={(v) => !isDeleting && setDeleteModalOpen(v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deletar Tarefa</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Tem certeza que deseja deletar esta tarefa? Esta ação não pode ser desfeita.</p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Deletando...' : 'Deletar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
